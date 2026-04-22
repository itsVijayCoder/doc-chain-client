"use client";

import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   Ban,
   Check,
   CheckCircle2,
   ChevronDown,
   KeyRound,
   Lock,
   Mail,
   MoreVertical,
   Pencil,
   Plus,
   Search as SearchIcon,
   Shield,
   ShieldCheck,
   ShieldOff,
   Trash2,
   UserCheck,
   UserPlus,
   Users,
   X,
} from "lucide-react";
import { adminService, type AdminUser } from "@/lib/services/adminService";
import { roleService } from "@/lib/services/roleService";
import type { ApiError } from "@/lib/types";
import { useToast } from "@/lib/hooks/useToast";
import { AuthenticatedImage } from "@/components/shared/AuthenticatedImage";
import {
   DcButton,
   PageHead,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";

// ═══════════════════════════════════════════════════════════════════
// Deterministic avatar color — hash user.id → index into palette.
// Same user ID → same color across sessions/devices, no storage needed.
// ═══════════════════════════════════════════════════════════════════
const AVATAR_COLORS = [
   "#F44336", "#E91E63", "#9C27B0", "#673AB7",
   "#3F51B5", "#2196F3", "#00BCD4", "#009688",
   "#4CAF50", "#FF9800", "#FF5722", "#795548",
   "#607D8B", "#3B82F6", "#8B5CF6", "#EC4899",
];

function getAvatarColor(userId: string): string {
   let hash = 0;
   for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
   }
   return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ═══════════════════════════════════════════════════════════════════
// Role → chip color mapping. Built-in slugs get canonical colors;
// custom roles default to teal. `getRoleStyle` returns the full
// (color, bg, border) triple so we can use design-system opacities.
// ═══════════════════════════════════════════════════════════════════
const BUILTIN_ROLE_HUES: Record<string, string> = {
   super_admin: "#a855f7",  // purple
   admin:       "#3b82f6",  // blue
   user:        "#64748b",  // gray
};

function getRoleStyle(slug: string): React.CSSProperties {
   const hue = BUILTIN_ROLE_HUES[slug] ?? "#14b8a6"; // custom roles → teal
   return {
      color: hue,
      background: `${hue}18`,
      border: `1px solid ${hue}44`,
   };
}

function prettyRoleName(slug: string): string {
   // Turn "super_admin" → "Super Admin", "legal-team" → "Legal Team"
   return slug
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════
function initialsOf(u: AdminUser): string {
   const f = u.first_name?.[0] ?? "";
   const l = u.last_name?.[0] ?? "";
   const init = (f + l).toUpperCase();
   return init || (u.email?.[0] ?? "?").toUpperCase();
}

function displayName(u: AdminUser): string {
   const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
   return n || u.email;
}

function formatRelativeTime(iso?: string): string {
   if (!iso) return "—";
   const date = new Date(iso);
   const diff = Date.now() - date.getTime();
   const mins = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);
   if (mins < 1) return "just now";
   if (mins < 60) return `${mins}m ago`;
   if (hours < 24) return `${hours}h ago`;
   if (days < 30) return `${days}d ago`;
   return date.toLocaleDateString();
}

function formatDate(iso?: string): string {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
   });
}

// ─────────────────────────────────────────────────────────────────────
// Empty-form seed used by Add User + Edit User
// ─────────────────────────────────────────────────────────────────────
const EMPTY_CREATE = {
   first_name: "",
   last_name: "",
   email: "",
   password: "",
};

type RoleFilterValue = string | "all";
type TwoFaFilter = "all" | "enabled" | "disabled";

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════
export default function AdminUsersPage() {
   const { user, isLoading: authLoading } = useAuth();
   const queryClient = useQueryClient();
   const toast = useToast();

   const [addUserOpen, setAddUserOpen] = useState(false);
   const [createForm, setCreateForm] = useState(EMPTY_CREATE);
   const [createRole, setCreateRole] = useState<string>("");
   const [createError, setCreateError] = useState<string | null>(null);

   const [editUser, setEditUser] = useState<AdminUser | null>(null);
   const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "" });

   const [assignRoleUser, setAssignRoleUser] = useState<AdminUser | null>(null);
   const [pendingRoles, setPendingRoles] = useState<string[]>([]);

   const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);

   const [twoFaFilter, setTwoFaFilter] = useState<TwoFaFilter>("all");
   const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
   const [searchQuery, setSearchQuery] = useState("");

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

   // ── Queries ──────────────────────────────────────────────────────
   const { data, isLoading } = useQuery({
      queryKey: ["admin", "users"],
      queryFn: () => adminService.listUsers({ page_size: 50 }),
      enabled: !!user && isAdmin(user.role),
      staleTime: 30_000,
   });

   const { data: stats } = useQuery({
      queryKey: ["admin", "stats"],
      queryFn: () => adminService.getStats(),
      enabled: !!user && isAdmin(user.role),
      staleTime: 60_000,
   });

   const { data: roles = [] } = useQuery({
      queryKey: ["admin", "roles"],
      queryFn: () => roleService.listRoles(),
      enabled: !!user && isAdmin(user.role),
      staleTime: 60_000,
   });

   // ── Mutations ────────────────────────────────────────────────────
   const createMutation = useMutation({
      mutationFn: () =>
         adminService.createUser({
            first_name: createForm.first_name.trim(),
            last_name: createForm.last_name.trim(),
            email: createForm.email.trim(),
            password: createForm.password,
            roles: createRole ? [createRole] : [],
         }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         setAddUserOpen(false);
         setCreateForm(EMPTY_CREATE);
         setCreateRole("");
         setCreateError(null);
         toast.success("User created");
      },
      onError: (err: ApiError) =>
         setCreateError(err?.details?.[0] ?? err?.message ?? "Failed to create user"),
   });

   const updateUserMutation = useMutation({
      mutationFn: ({
         userId,
         patch,
      }: {
         userId: string;
         patch: Parameters<typeof adminService.updateUser>[1];
      }) => adminService.updateUser(userId, patch),
      onSuccess: () =>
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
   });

   const updateRolesMutation = useMutation({
      mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
         adminService.updateUserRoles(userId, roles),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         setAssignRoleUser(null);
         toast.success("Roles updated");
      },
      onError: (err: ApiError) =>
         toast.error("Failed to update roles", err?.message ?? "Try again"),
   });

   const force2faMutation = useMutation({
      mutationFn: (userId: string) => adminService.forceDisable2fa(userId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         toast.success("2FA disabled");
      },
      onError: (err: ApiError) =>
         toast.error("Failed to disable 2FA", err?.message ?? "Try again"),
   });

   const deleteMutation = useMutation({
      mutationFn: (userId: string) => adminService.deleteUser(userId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         setDeleteUserTarget(null);
         toast.success("User deleted");
      },
      onError: (err: ApiError) =>
         toast.error("Failed to delete user", err?.message ?? "Try again"),
   });

   // ── Derived ──────────────────────────────────────────────────────
   const allUsers = data?.data ?? [];
   const total = data?.meta.total ?? 0;

   const users = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      return allUsers.filter((u) => {
         // Search
         const matchSearch =
            !q ||
            u.email.toLowerCase().includes(q) ||
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
         // 2FA filter
         const matchTwoFa =
            twoFaFilter === "all" ||
            (twoFaFilter === "enabled" && u.totp_enabled) ||
            (twoFaFilter === "disabled" && !u.totp_enabled);
         // Role filter
         const matchRole =
            roleFilter === "all" || (u.roles ?? []).includes(roleFilter);
         return matchSearch && matchTwoFa && matchRole;
      });
   }, [allUsers, searchQuery, twoFaFilter, roleFilter]);

   // ── Handlers ─────────────────────────────────────────────────────
   const handleCreate = () => {
      setCreateError(null);
      if (!createForm.email.trim() || !createForm.password || !createForm.first_name.trim()) {
         setCreateError("First name, email, and password are required");
         return;
      }
      createMutation.mutate();
   };

   const handleEditSave = () => {
      if (!editUser) return;
      updateUserMutation.mutate(
         {
            userId: editUser.id,
            patch: {
               first_name: editForm.first_name,
               last_name: editForm.last_name,
               email: editForm.email,
            },
         },
         {
            onSuccess: () => {
               setEditUser(null);
               toast.success("Profile updated");
            },
            onError: (err: unknown) => {
               const e = err as ApiError;
               toast.error("Update failed", e?.message ?? "Try again");
            },
         }
      );
   };

   const handleSuspendToggle = (u: AdminUser) => {
      const next: "active" | "inactive" = u.status === "active" ? "inactive" : "active";
      updateUserMutation.mutate(
         { userId: u.id, patch: { status: next } },
         {
            onSuccess: () => {
               toast.success(next === "active" ? "User activated" : "User suspended");
            },
            onError: (err: unknown) => {
               const e = err as ApiError;
               toast.error("Action failed", e?.message ?? "Try again");
            },
         }
      );
   };

   if (authLoading) {
      return (
         <div className='flex items-center justify-center min-h-screen'>
            <div
               className='w-12 h-12 rounded-full border-b-2 animate-spin'
               style={{ borderColor: "var(--dc-accent)" }}
            />
         </div>
      );
   }

   if (!user || !isAdmin(user.role)) return null;

   const activeCount = stats?.active_users ?? 0;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='User Management'
            titleIcon={<Users size={22} strokeWidth={1.75} />}
            subtitle={<span>Manage users, roles, and permissions</span>}
            actions={
               <DcButton
                  variant='primary'
                  icon={<UserPlus size={14} strokeWidth={2} />}
                  onClick={() => setAddUserOpen(true)}
               >
                  Add User
               </DcButton>
            }
         />

         {/* ── Stats strip (5 cards) ───────────────────────────── */}
         <StatsStrip cols={5}>
            <Stat
               label='Total users'
               labelIcon={<Users size={12} strokeWidth={1.75} />}
               value={isLoading ? "—" : total.toString()}
               trend='All registered'
            />
            <Stat
               label='Active accounts'
               labelIcon={<UserCheck size={12} strokeWidth={1.75} />}
               value={isLoading ? "—" : activeCount.toString()}
               trend={
                  stats?.total_users
                     ? `${Math.round((activeCount / stats.total_users) * 100)}% of total`
                     : ""
               }
            />
            <Stat
               label='New this month'
               labelIcon={<Mail size={12} strokeWidth={1.75} />}
               value={isLoading || !stats ? "—" : stats.new_users_this_month.toString()}
               trend='Recent signups'
            />
            <Stat
               label='Suspended'
               labelIcon={<Lock size={12} strokeWidth={1.75} />}
               value={isLoading || !stats ? "—" : stats.suspended_users.toString()}
               valueColor={
                  stats?.suspended_users && stats.suspended_users > 0
                     ? "var(--dc-danger)"
                     : undefined
               }
               trend='Accounts suspended'
            />
            <Stat
               label='2FA enabled'
               labelIcon={
                  <ShieldCheck
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               value={
                  isLoading || stats?.totp_enabled_count == null
                     ? "—"
                     : stats.totp_enabled_count.toString()
               }
               trend={
                  stats?.total_users && stats.totp_enabled_count != null
                     ? `${Math.round((stats.totp_enabled_count / stats.total_users) * 100)}% coverage`
                     : "2FA adoption"
               }
            />
         </StatsStrip>

         {/* ── Toolbar ──────────────────────────────────────────── */}
         <div className='flex items-center gap-2 mb-4 flex-wrap'>
            {/* Search */}
            <div
               className='flex items-center gap-2 px-2.5 h-8 rounded-md flex-1 min-w-[240px] transition-all'
               style={{
                  background: "var(--dc-surface)",
                  border: "1px solid var(--dc-border)",
               }}
               onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
               }}
               onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-border)";
                  e.currentTarget.style.boxShadow = "none";
               }}
            >
               <SearchIcon size={14} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search users by name or email…'
                  className='flex-1 bg-transparent border-none outline-none text-[13px] min-w-0'
                  style={{ color: "var(--dc-text)" }}
               />
            </div>

            {/* Role filter dropdown */}
            <RoleFilterDropdown
               value={roleFilter}
               roles={roles.map((r) => ({ slug: r.slug ?? r.name.toLowerCase(), name: r.name, color: r.color }))}
               onChange={setRoleFilter}
            />

            {/* 2FA filter */}
            <div
               className='inline-flex rounded-md p-[3px] gap-[2px] h-8'
               style={{
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border)",
               }}
            >
               <FilterBtn active={twoFaFilter === "all"} onClick={() => setTwoFaFilter("all")}>
                  All
               </FilterBtn>
               <FilterBtn
                  active={twoFaFilter === "enabled"}
                  onClick={() => setTwoFaFilter("enabled")}
                  icon={<ShieldCheck size={11} strokeWidth={1.75} />}
               >
                  2FA on
               </FilterBtn>
               <FilterBtn
                  active={twoFaFilter === "disabled"}
                  onClick={() => setTwoFaFilter("disabled")}
                  icon={<ShieldOff size={11} strokeWidth={1.75} />}
               >
                  2FA off
               </FilterBtn>
            </div>
         </div>

         {/* ── Users table ──────────────────────────────────────── */}
         <div
            className='rounded-xl overflow-hidden'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
            }}
         >
            {isLoading ? (
               <div className='py-12 text-center text-[13px]' style={{ color: "var(--dc-text-dim)" }}>
                  Loading users…
               </div>
            ) : (
               <div className='overflow-x-auto'>
                  <table className='w-full border-collapse text-[13px]'>
                     <thead>
                        <tr
                           style={{
                              background: "var(--dc-surface-2)",
                              borderBottom: "1px solid var(--dc-border)",
                           }}
                        >
                           <Th>User</Th>
                           <Th>Role</Th>
                           <Th>Status</Th>
                           <Th>Documents</Th>
                           <Th>2FA</Th>
                           <Th>Last active</Th>
                           <Th>Joined</Th>
                           <Th style={{ width: 60 }} align='right'>
                              Actions
                           </Th>
                        </tr>
                     </thead>
                     <tbody>
                        {users.map((u) => (
                           <UserRow
                              key={u.id}
                              user={u}
                              onEdit={() => {
                                 setEditUser(u);
                                 setEditForm({
                                    first_name: u.first_name ?? "",
                                    last_name: u.last_name ?? "",
                                    email: u.email,
                                 });
                              }}
                              onAssignRole={() => {
                                 setAssignRoleUser(u);
                                 setPendingRoles([...(u.roles ?? [])]);
                              }}
                              onResetPassword={() =>
                                 toast.info("Reset Password", "Coming soon")
                              }
                              onDisable2fa={() => force2faMutation.mutate(u.id)}
                              onSuspendToggle={() => handleSuspendToggle(u)}
                              onDelete={() => setDeleteUserTarget(u)}
                           />
                        ))}
                        {users.length === 0 && (
                           <tr>
                              <td colSpan={8} className='py-12 text-center text-[13px]' style={{ color: "var(--dc-text-dim)" }}>
                                 No users match your filters.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* ── Add User Dialog ─────────────────────────────────── */}
         <Dialog
            open={addUserOpen}
            onOpenChange={(o) => {
               setAddUserOpen(o);
               if (!o) {
                  setCreateForm(EMPTY_CREATE);
                  setCreateRole("");
                  setCreateError(null);
               }
            }}
         >
            <DialogContent className='max-w-md'>
               <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
               </DialogHeader>

               <div className='space-y-4 py-2'>
                  <div className='grid grid-cols-2 gap-3'>
                     <Field label='First name'>
                        <DcInput
                           value={createForm.first_name}
                           onChange={(v) => setCreateForm((f) => ({ ...f, first_name: v }))}
                           placeholder='Jane'
                        />
                     </Field>
                     <Field label='Last name'>
                        <DcInput
                           value={createForm.last_name}
                           onChange={(v) => setCreateForm((f) => ({ ...f, last_name: v }))}
                           placeholder='Doe'
                        />
                     </Field>
                  </div>
                  <Field label='Email'>
                     <DcInput
                        type='email'
                        value={createForm.email}
                        onChange={(v) => setCreateForm((f) => ({ ...f, email: v }))}
                        placeholder='jane@example.com'
                     />
                  </Field>
                  <Field label='Password'>
                     <DcInput
                        type='password'
                        value={createForm.password}
                        onChange={(v) => setCreateForm((f) => ({ ...f, password: v }))}
                        placeholder='Temporary password'
                     />
                  </Field>
                  <Field label='Role'>
                     <NativeSelect
                        value={createRole}
                        onChange={setCreateRole}
                        options={[
                           { value: "", label: "No role" },
                           ...roles.map((r) => ({
                              value: r.slug ?? r.name.toLowerCase(),
                              label: r.name,
                           })),
                        ]}
                     />
                  </Field>
                  {createError && (
                     <p className='text-[13px]' style={{ color: "var(--dc-danger)" }}>
                        {createError}
                     </p>
                  )}
               </div>

               <DialogFooter>
                  <DcButton onClick={() => setAddUserOpen(false)}>Cancel</DcButton>
                  <DcButton variant='primary' onClick={handleCreate} disabled={createMutation.isPending}>
                     {createMutation.isPending ? "Creating…" : "Create User"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Edit User Dialog ────────────────────────────────── */}
         <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
            <DialogContent className='max-w-md'>
               <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
               </DialogHeader>
               <div className='space-y-4 py-2'>
                  <div className='grid grid-cols-2 gap-3'>
                     <Field label='First name'>
                        <DcInput
                           value={editForm.first_name}
                           onChange={(v) => setEditForm((f) => ({ ...f, first_name: v }))}
                        />
                     </Field>
                     <Field label='Last name'>
                        <DcInput
                           value={editForm.last_name}
                           onChange={(v) => setEditForm((f) => ({ ...f, last_name: v }))}
                        />
                     </Field>
                  </div>
                  <Field label='Email'>
                     <DcInput
                        type='email'
                        value={editForm.email}
                        onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
                     />
                  </Field>
               </div>
               <DialogFooter>
                  <DcButton onClick={() => setEditUser(null)}>Cancel</DcButton>
                  <DcButton
                     variant='primary'
                     onClick={handleEditSave}
                     disabled={updateUserMutation.isPending}
                  >
                     {updateUserMutation.isPending ? "Saving…" : "Save Changes"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Assign Role Dialog ──────────────────────────────── */}
         <Dialog
            open={!!assignRoleUser}
            onOpenChange={(o) => !o && setAssignRoleUser(null)}
         >
            <DialogContent className='max-w-md'>
               <DialogHeader>
                  <DialogTitle>
                     Assign Roles
                     {assignRoleUser && (
                        <span
                           className='ml-1 font-normal'
                           style={{ color: "var(--dc-text-dim)" }}
                        >
                           — {displayName(assignRoleUser)}
                        </span>
                     )}
                  </DialogTitle>
               </DialogHeader>

               <div className='space-y-4 py-2'>
                  <div>
                     <label
                        className='block text-[12px] font-semibold mb-2'
                        style={{ color: "var(--dc-text)" }}
                     >
                        Current roles
                     </label>
                     <div className='flex flex-wrap gap-1.5 min-h-[28px]'>
                        {pendingRoles.length === 0 ? (
                           <span
                              className='text-[12px] italic'
                              style={{ color: "var(--dc-text-faint)" }}
                           >
                              No roles assigned
                           </span>
                        ) : (
                           pendingRoles.map((slug) => (
                              <span
                                 key={slug}
                                 className='inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full text-[12px] font-medium'
                                 style={getRoleStyle(slug)}
                              >
                                 {prettyRoleName(slug)}
                                 <button
                                    type='button'
                                    aria-label={`Remove ${slug}`}
                                    onClick={() =>
                                       setPendingRoles((prev) => prev.filter((p) => p !== slug))
                                    }
                                    className='w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-70 hover:opacity-100'
                                 >
                                    <X size={10} strokeWidth={2.5} />
                                 </button>
                              </span>
                           ))
                        )}
                     </div>
                  </div>

                  <div>
                     <label
                        className='block text-[12px] font-semibold mb-2'
                        style={{ color: "var(--dc-text)" }}
                     >
                        Add role
                     </label>
                     <NativeSelect
                        value=''
                        onChange={(slug) => {
                           if (!slug) return;
                           setPendingRoles((prev) =>
                              prev.includes(slug) ? prev : [...prev, slug]
                           );
                        }}
                        options={[
                           { value: "", label: "Select a role…" },
                           ...roles
                              .map((r) => ({
                                 value: r.slug ?? r.name.toLowerCase(),
                                 label: r.name,
                              }))
                              .filter((opt) => !pendingRoles.includes(opt.value)),
                        ]}
                     />
                  </div>
               </div>

               <DialogFooter>
                  <DcButton
                     onClick={() => setAssignRoleUser(null)}
                     disabled={updateRolesMutation.isPending}
                  >
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='primary'
                     onClick={() =>
                        assignRoleUser &&
                        updateRolesMutation.mutate({
                           userId: assignRoleUser.id,
                           roles: pendingRoles,
                        })
                     }
                     disabled={updateRolesMutation.isPending}
                  >
                     {updateRolesMutation.isPending ? "Saving…" : "Save"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Delete confirmation ─────────────────────────────── */}
         <Dialog
            open={!!deleteUserTarget}
            onOpenChange={(o) => !o && setDeleteUserTarget(null)}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Delete user</DialogTitle>
               </DialogHeader>
               <p className='text-[13px]' style={{ color: "var(--dc-text-muted)" }}>
                  Permanently delete{" "}
                  <span className='font-semibold' style={{ color: "var(--dc-text)" }}>
                     {deleteUserTarget && displayName(deleteUserTarget)}
                  </span>
                  ? This cannot be undone. Their documents and audit history
                  remain intact.
               </p>
               <DialogFooter>
                  <DcButton
                     onClick={() => setDeleteUserTarget(null)}
                     disabled={deleteMutation.isPending}
                  >
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='danger'
                     onClick={() =>
                        deleteUserTarget && deleteMutation.mutate(deleteUserTarget.id)
                     }
                     disabled={deleteMutation.isPending}
                  >
                     {deleteMutation.isPending ? "Deleting…" : "Delete user"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}

// ═══════════════════════════════════════════════════════════════════
// User row
// ═══════════════════════════════════════════════════════════════════
interface UserRowProps {
   user: AdminUser;
   onEdit: () => void;
   onAssignRole: () => void;
   onResetPassword: () => void;
   onDisable2fa: () => void;
   onSuspendToggle: () => void;
   onDelete: () => void;
}

const UserRow: FC<UserRowProps> = ({
   user,
   onEdit,
   onAssignRole,
   onResetPassword,
   onDisable2fa,
   onSuspendToggle,
   onDelete,
}) => {
   const active = user.status === "active";
   const roles = user.roles ?? [];
   const docCount = user.documents_count ?? 0;

   return (
      <tr
         className='transition-colors'
         style={{ borderBottom: "1px solid var(--dc-border)" }}
         onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--dc-surface-2)")
         }
         onMouseLeave={(e) => (e.currentTarget.style.background = "")}
      >
         <Td>
            <div className='flex items-center gap-2.5 min-w-0'>
               <Avatar user={user} />
               <div className='min-w-0'>
                  <div
                     className='text-[12.5px] font-medium truncate'
                     style={{ color: "var(--dc-text)" }}
                  >
                     {displayName(user)}
                  </div>
                  <div
                     className='text-[11px] truncate'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     {user.email}
                  </div>
               </div>
            </div>
         </Td>

         {/* Role — chip(s) or "No role" */}
         <Td>
            {roles.length === 0 ? (
               <span style={{ color: "var(--dc-text-faint)" }}>No role</span>
            ) : (
               <div className='flex flex-wrap gap-1'>
                  {roles.map((slug) => (
                     <span
                        key={slug}
                        className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                        style={getRoleStyle(slug)}
                     >
                        {prettyRoleName(slug)}
                     </span>
                  ))}
               </div>
            )}
         </Td>

         {/* Status — green Active / red Suspended */}
         <Td>
            <span
               className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
               style={
                  active
                     ? {
                          color: "var(--dc-accent)",
                          background: "var(--dc-accent-soft)",
                          border: "1px solid var(--dc-accent-border)",
                       }
                     : {
                          color: "var(--dc-danger)",
                          background: "var(--dc-danger-soft)",
                          border: "1px solid var(--dc-danger-border)",
                       }
               }
            >
               {active ? "Active" : "Suspended"}
            </span>
         </Td>

         {/* Documents — clickable link if > 0 */}
         <Td>
            {docCount > 0 ? (
               <Link
                  href={`/documents?owner=${user.id}`}
                  className='tabular-nums transition-colors'
                  style={{ color: "var(--dc-accent)" }}
                  onClick={(e) => e.stopPropagation()}
               >
                  {docCount}
               </Link>
            ) : (
               <span
                  className='tabular-nums'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  0
               </span>
            )}
         </Td>

         {/* 2FA — icon */}
         <Td>
            {user.totp_enabled ? (
               <ShieldCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: "var(--dc-accent)" }}
                  aria-label='2FA enabled'
               />
            ) : (
               <ShieldOff
                  size={15}
                  strokeWidth={1.5}
                  style={{ color: "var(--dc-text-faint)" }}
                  aria-label='2FA disabled'
               />
            )}
         </Td>

         {/* Last active */}
         <Td>
            {user.last_active_at ? (
               <span style={{ color: "var(--dc-text-muted)" }}>
                  {formatRelativeTime(user.last_active_at)}
               </span>
            ) : (
               <span style={{ color: "var(--dc-text-faint)" }}>Never</span>
            )}
         </Td>

         {/* Joined */}
         <Td
            style={{
               color: "var(--dc-text-muted)",
               fontVariantNumeric: "tabular-nums",
            }}
            title={user.created_at ? new Date(user.created_at).toLocaleString() : ""}
         >
            {formatDate(user.created_at)}
         </Td>

         {/* Actions — ⋮ menu */}
         <Td align='right'>
            <DropdownMenu>
               <DropdownMenuTrigger
                  aria-label='User actions'
                  className='w-[26px] h-[26px] rounded-md inline-flex items-center justify-center transition-colors ml-auto'
                  style={{
                     background: "var(--dc-surface)",
                     border: "1px solid var(--dc-border)",
                     color: "var(--dc-text-muted)",
                  }}
               >
                  <MoreVertical size={13} strokeWidth={1.75} />
               </DropdownMenuTrigger>
               <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={onEdit}>
                     <Pencil className='mr-2 h-4 w-4' />
                     Edit user
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAssignRole}>
                     <Shield className='mr-2 h-4 w-4' />
                     Assign role
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={onResetPassword}>
                     <KeyRound className='mr-2 h-4 w-4' />
                     Reset password
                  </DropdownMenuItem>

                  {user.totp_enabled && (
                     <DropdownMenuItem variant='destructive' onClick={onDisable2fa}>
                        <ShieldOff className='mr-2 h-4 w-4' />
                        Disable 2FA
                     </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {active ? (
                     <DropdownMenuItem variant='destructive' onClick={onSuspendToggle}>
                        <Ban className='mr-2 h-4 w-4' />
                        Suspend user
                     </DropdownMenuItem>
                  ) : (
                     <DropdownMenuItem onClick={onSuspendToggle}>
                        <CheckCircle2 className='mr-2 h-4 w-4' />
                        Activate user
                     </DropdownMenuItem>
                  )}

                  <DropdownMenuItem variant='destructive' onClick={onDelete}>
                     <Trash2 className='mr-2 h-4 w-4' />
                     Delete user
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </Td>
      </tr>
   );
};

// ═══════════════════════════════════════════════════════════════════
// Avatar — auth-fetched image when avatar_url set, else initials +
// deterministic color. AuthenticatedImage handles the bearer-token
// fetch and falls back to the initials tile on 404/load error.
// ═══════════════════════════════════════════════════════════════════
const Avatar: FC<{ user: AdminUser }> = ({ user }) => {
   const initialsFallback = (
      <div
         className='w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0'
         style={{ background: getAvatarColor(user.id) }}
      >
         {initialsOf(user)}
      </div>
   );

   if (!user.avatar_url) return initialsFallback;

   return (
      <div className='w-7 h-7 rounded-full overflow-hidden shrink-0'>
         <AuthenticatedImage
            src={user.avatar_url}
            alt={displayName(user)}
            className='w-7 h-7 object-cover'
            fallback={initialsFallback}
         />
      </div>
   );
};

// ═══════════════════════════════════════════════════════════════════
// Role filter dropdown
// ═══════════════════════════════════════════════════════════════════
interface RoleFilterOption {
   slug: string;
   name: string;
   color?: string;
}

const RoleFilterDropdown: FC<{
   value: RoleFilterValue;
   roles: RoleFilterOption[];
   onChange: (v: RoleFilterValue) => void;
}> = ({ value, roles, onChange }) => {
   const activeLabel =
      value === "all"
         ? "All roles"
         : roles.find((r) => r.slug === value)?.name ?? prettyRoleName(value);

   return (
      <DropdownMenu>
         <DropdownMenuTrigger
            aria-label='Filter by role'
            className='inline-flex items-center gap-2 h-8 px-2.5 rounded-md text-[13px] transition-colors'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text)",
            }}
         >
            <Shield size={12} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />
            {activeLabel}
            <ChevronDown size={12} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />
         </DropdownMenuTrigger>
         <DropdownMenuContent align='start'>
            <DropdownMenuItem onClick={() => onChange("all")}>
               {value === "all" && <Check className='mr-2 h-4 w-4' />}
               {value !== "all" && <span className='w-5' />}
               All roles
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {roles.map((r) => (
               <DropdownMenuItem key={r.slug} onClick={() => onChange(r.slug)}>
                  {value === r.slug && <Check className='mr-2 h-4 w-4' />}
                  {value !== r.slug && <span className='w-5' />}
                  <span
                     className='inline-block w-2 h-2 rounded-full mr-2'
                     style={{
                        background: r.color || BUILTIN_ROLE_HUES[r.slug] || "#14b8a6",
                     }}
                  />
                  {r.name}
               </DropdownMenuItem>
            ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

// ═══════════════════════════════════════════════════════════════════
// Inline helpers
// ═══════════════════════════════════════════════════════════════════
const FilterBtn: FC<{
   active?: boolean;
   onClick?: () => void;
   icon?: ReactNode;
   children: ReactNode;
}> = ({ active, onClick, icon, children }) => (
   <button
      type='button'
      onClick={onClick}
      className='inline-flex items-center gap-1 px-2.5 text-[12px] font-medium rounded transition-colors h-full'
      style={
         active
            ? {
                 background: "var(--dc-surface)",
                 color: "var(--dc-text)",
                 boxShadow: "var(--dc-shadow-sm)",
              }
            : { background: "transparent", color: "var(--dc-text-dim)" }
      }
   >
      {icon}
      {children}
   </button>
);

const Th: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
   align?: "left" | "right";
}> = ({ children, style, align = "left" }) => (
   <th
      className='px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap'
      style={{ color: "var(--dc-text-dim)", textAlign: align, ...style }}
   >
      {children}
   </th>
);

const Td: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
   align?: "left" | "right";
   title?: string;
}> = ({ children, style, align = "left", title }) => (
   <td
      className='px-4 py-2.5 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", textAlign: align, ...style }}
      title={title}
   >
      {children}
   </td>
);

const Field: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
   <div>
      <label
         className='block text-[12px] font-semibold mb-1.5'
         style={{ color: "var(--dc-text)" }}
      >
         {label}
      </label>
      {children}
   </div>
);

const DcInput: FC<{
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   type?: string;
}> = ({ value, onChange, placeholder, type }) => (
   <input
      type={type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className='w-full h-[34px] px-2.5 rounded-md text-[13px] outline-none transition-all'
      style={{
         background: "var(--dc-surface-2)",
         border: "1px solid var(--dc-border)",
         color: "var(--dc-text)",
      }}
      onFocus={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-accent-border)";
         e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
      }}
      onBlur={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-border)";
         e.currentTarget.style.boxShadow = "none";
      }}
   />
);

// Plain HTML select styled to match DcInput — simpler than rigging
// shadcn Select for the role-picker use case (no need for async search,
// templating, etc.).
const NativeSelect: FC<{
   value: string;
   onChange: (v: string) => void;
   options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
   <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='w-full h-[34px] px-2.5 pr-8 rounded-md text-[13px] outline-none transition-all appearance-none cursor-pointer'
      style={{
         background: "var(--dc-surface-2)",
         border: "1px solid var(--dc-border)",
         color: "var(--dc-text)",
         backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgb(107,118,132)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'></polyline></svg>")',
         backgroundRepeat: "no-repeat",
         backgroundPosition: "right 10px center",
      }}
      onFocus={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-accent-border)";
         e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
      }}
      onBlur={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-border)";
         e.currentTarget.style.boxShadow = "none";
      }}
   >
      {options.map((o) => (
         <option key={o.value} value={o.value}>
            {o.label}
         </option>
      ))}
   </select>
);
