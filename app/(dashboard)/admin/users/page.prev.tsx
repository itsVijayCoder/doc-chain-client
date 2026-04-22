"use client";

import { FC, ReactNode, useEffect, useMemo, useState } from "react";
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
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   Calendar,
   Check,
   Clock,
   Lock,
   Mail,
   MoreVertical,
   Search as SearchIcon,
   Shield,
   ShieldCheck,
   ShieldOff,
   UserCheck,
   UserPlus,
   Users,
} from "lucide-react";
import { adminService, type AdminUser } from "@/lib/services/adminService";
import {
   DcButton,
   PageHead,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";

const EMPTY_FORM = {
   first_name: "",
   last_name: "",
   email: "",
   password: "",
   role: "viewer",
};

// Stable gradient-by-initials so the same user always gets the same avatar
// colour, giving the table a recognisable colour cue when scanning.
function avatarGradient(seed: string): string {
   const palettes = [
      "linear-gradient(135deg, #6366f1, #ec4899)",
      "linear-gradient(135deg, #0ea5e9, #6366f1)",
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #f59e0b, #f43f5e)",
      "linear-gradient(135deg, #a855f7, #ec4899)",
      "linear-gradient(135deg, #64748b, #475569)",
   ];
   let hash = 0;
   for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
   return palettes[Math.abs(hash) % palettes.length];
}

function initialsOf(u: AdminUser): string {
   const f = u.first_name?.[0] ?? "";
   const l = u.last_name?.[0] ?? "";
   const init = (f + l).toUpperCase();
   if (init) return init;
   return (u.email?.[0] ?? "?").toUpperCase();
}

function displayName(u: AdminUser): string {
   const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
   return n || u.email;
}

function formatRelativeTime(iso?: string): string {
   if (!iso) return "—";
   const date = new Date(iso);
   const now = new Date();
   const diff = now.getTime() - date.getTime();
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

// Role chip colour — matches the design's action-pill hue mapping.
function roleChipStyle(role: string): React.CSSProperties {
   switch (role) {
      case "admin":
      case "super_admin":
         return {
            background: "var(--dc-danger-soft)",
            color: "var(--dc-danger)",
            border: "1px solid var(--dc-danger-border)",
         };
      case "editor":
         return {
            background: "var(--dc-info-soft)",
            color: "var(--dc-info)",
            border: "1px solid var(--dc-info-border)",
         };
      case "viewer":
      default:
         return {
            background: "var(--dc-surface-2)",
            color: "var(--dc-text-muted)",
            border: "1px solid var(--dc-border)",
         };
   }
}

function statusPillStyle(status: string): React.CSSProperties {
   switch (status) {
      case "active":
         return {
            background: "var(--dc-accent-soft)",
            color: "var(--dc-accent)",
            border: "1px solid var(--dc-accent-border)",
         };
      case "inactive":
         return {
            background: "var(--dc-warn-soft)",
            color: "var(--dc-warn)",
            border: "1px solid var(--dc-warn-border)",
         };
      case "suspended":
         return {
            background: "var(--dc-danger-soft)",
            color: "var(--dc-danger)",
            border: "1px solid var(--dc-danger-border)",
         };
      default:
         return {
            background: "var(--dc-surface-2)",
            color: "var(--dc-text-muted)",
            border: "1px solid var(--dc-border)",
         };
   }
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
type TwoFaFilter = "all" | "enabled" | "disabled";

export default function AdminUsersPage() {
   const { user, isLoading: authLoading } = useAuth();
   const queryClient = useQueryClient();

   const [addUserOpen, setAddUserOpen] = useState(false);
   const [form, setForm] = useState(EMPTY_FORM);
   const [formError, setFormError] = useState<string | null>(null);
   const [twoFaFilter, setTwoFaFilter] = useState<TwoFaFilter>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [roleChangeUser, setRoleChangeUser] = useState<AdminUser | null>(null);
   const [roleChangeValue, setRoleChangeValue] = useState<string>("viewer");

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

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

   const createMutation = useMutation({
      mutationFn: () =>
         adminService.createUser({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            password: form.password,
            roles: [form.role],
         }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         setAddUserOpen(false);
         setForm(EMPTY_FORM);
         setFormError(null);
      },
      onError: (err: { details?: string[]; message?: string }) => {
         setFormError(
            err?.details?.[0] ?? err?.message ?? "Failed to create user"
         );
      },
   });

   const forceDisable2faMutation = useMutation({
      mutationFn: (userId: string) => adminService.forceDisable2fa(userId),
      onSuccess: () =>
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
   });

   const updateRolesMutation = useMutation({
      mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
         adminService.updateUserRoles(userId, roles),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
         setRoleChangeUser(null);
      },
   });

   const handleAddUser = () => {
      setFormError(null);
      if (!form.email.trim() || !form.password || !form.first_name.trim()) {
         setFormError("First name, email, and password are required");
         return;
      }
      createMutation.mutate();
   };

   const allUsers = data?.data ?? [];
   const total = data?.meta.total ?? 0;

   const users = useMemo(
      () =>
         allUsers.filter((u) => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
               !q ||
               u.email.toLowerCase().includes(q) ||
               `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
            const matchTwoFa =
               twoFaFilter === "all" ||
               (twoFaFilter === "enabled" && u.totp_enabled) ||
               (twoFaFilter === "disabled" && !u.totp_enabled);
            return matchSearch && matchTwoFa;
         }),
      [allUsers, searchQuery, twoFaFilter]
   );

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

   const activeCount = allUsers.filter((u) => u.status === "active").length;

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

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Total users'
               labelIcon={<Users size={12} strokeWidth={1.75} />}
               value={isLoading ? "—" : total.toString()}
               trend='All registered'
            />
            <Stat
               label='Active users'
               labelIcon={<UserCheck size={12} strokeWidth={1.75} />}
               value={isLoading ? "—" : activeCount.toString()}
               trend='In current page'
            />
            <Stat
               label='New this month'
               labelIcon={<Mail size={12} strokeWidth={1.75} />}
               value={
                  isLoading || !stats ? "—" : stats.new_users_this_month.toString()
               }
               trend='Recent signups'
            />
            <Stat
               label='Suspended'
               labelIcon={<Lock size={12} strokeWidth={1.75} />}
               value={
                  isLoading || !stats ? "—" : stats.suspended_users.toString()
               }
               trend='Accounts suspended'
            />
         </StatsStrip>

         {/* ── Toolbar ──────────────────────────────────────────── */}
         <div className='flex items-center gap-2 mb-4 flex-wrap'>
            {/* Search input */}
            <div
               className='flex items-center gap-2 px-2.5 h-8 rounded-md flex-1 min-w-[240px] transition-all'
               style={{
                  background: "var(--dc-surface)",
                  border: "1px solid var(--dc-border)",
               }}
               onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-accent-border)";
                  e.currentTarget.style.boxShadow =
                     "0 0 0 3px var(--dc-accent-soft)";
               }}
               onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-border)";
                  e.currentTarget.style.boxShadow = "none";
               }}
            >
               <SearchIcon
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: "var(--dc-text-dim)" }}
               />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search users by name or email…'
                  className='flex-1 bg-transparent border-none outline-none text-[13px] min-w-0'
                  style={{ color: "var(--dc-text)" }}
               />
            </div>

            {/* 2FA filter segment */}
            <div
               className='inline-flex rounded-md p-[3px] gap-[2px] h-8'
               style={{
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border)",
               }}
            >
               <FilterBtn
                  active={twoFaFilter === "all"}
                  onClick={() => setTwoFaFilter("all")}
               >
                  All
               </FilterBtn>
               <FilterBtn
                  active={twoFaFilter === "enabled"}
                  onClick={() => setTwoFaFilter("enabled")}
                  icon={<ShieldCheck size={11} strokeWidth={1.75} />}
               >
                  2FA enabled
               </FilterBtn>
               <FilterBtn
                  active={twoFaFilter === "disabled"}
                  onClick={() => setTwoFaFilter("disabled")}
                  icon={<ShieldOff size={11} strokeWidth={1.75} />}
               >
                  2FA disabled
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
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
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
                           <tr
                              key={u.id}
                              className='transition-colors'
                              style={{
                                 borderBottom: "1px solid var(--dc-border)",
                              }}
                              onMouseEnter={(e) =>
                                 (e.currentTarget.style.background =
                                    "var(--dc-surface-2)")
                              }
                              onMouseLeave={(e) =>
                                 (e.currentTarget.style.background = "")
                              }
                           >
                              <Td>
                                 <div className='flex items-center gap-2.5 min-w-0'>
                                    <div
                                       className='w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0'
                                       style={{
                                          background: avatarGradient(initialsOf(u)),
                                       }}
                                    >
                                       {initialsOf(u)}
                                    </div>
                                    <div className='min-w-0'>
                                       <div
                                          className='text-[12.5px] font-medium truncate'
                                          style={{ color: "var(--dc-text)" }}
                                       >
                                          {displayName(u)}
                                       </div>
                                       <div
                                          className='text-[11px] truncate'
                                          style={{ color: "var(--dc-text-dim)" }}
                                       >
                                          {u.email}
                                       </div>
                                    </div>
                                 </div>
                              </Td>
                              <Td>
                                 <span
                                    className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                                    style={roleChipStyle(u.roles?.[0] ?? "")}
                                 >
                                    {u.roles?.[0] ?? "—"}
                                 </span>
                              </Td>
                              <Td>
                                 <span
                                    className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                                    style={statusPillStyle(u.status)}
                                 >
                                    {u.status}
                                 </span>
                              </Td>
                              <Td style={{ fontVariantNumeric: "tabular-nums" }}>
                                 {u.documents_count ?? "—"}
                              </Td>
                              <Td>
                                 {u.totp_enabled ? (
                                    <Check
                                       size={14}
                                       strokeWidth={2}
                                       style={{ color: "var(--dc-accent)" }}
                                    />
                                 ) : (
                                    <span style={{ color: "var(--dc-text-faint)" }}>
                                       —
                                    </span>
                                 )}
                              </Td>
                              <Td style={{ color: "var(--dc-text-muted)" }}>
                                 {formatRelativeTime(u.last_active_at)}
                              </Td>
                              <Td
                                 style={{
                                    color: "var(--dc-text-muted)",
                                    fontVariantNumeric: "tabular-nums",
                                 }}
                              >
                                 {formatDate(u.created_at)}
                              </Td>
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
                                       <MoreVertical
                                          size={13}
                                          strokeWidth={1.75}
                                       />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                       <DropdownMenuItem
                                          onClick={() => {
                                             setRoleChangeUser(u);
                                             setRoleChangeValue(
                                                u.roles?.[0] ?? "viewer"
                                             );
                                          }}
                                       >
                                          <Shield className='mr-2 h-4 w-4' />
                                          Change Role
                                       </DropdownMenuItem>
                                       {u.totp_enabled && (
                                          <DropdownMenuItem
                                             variant='destructive'
                                             onClick={() =>
                                                forceDisable2faMutation.mutate(u.id)
                                             }
                                          >
                                             <ShieldOff className='mr-2 h-4 w-4' />
                                             Disable 2FA
                                          </DropdownMenuItem>
                                       )}
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                              </Td>
                           </tr>
                        ))}
                        {users.length === 0 && (
                           <tr>
                              <td
                                 colSpan={8}
                                 className='py-12 text-center text-[13px]'
                                 style={{ color: "var(--dc-text-dim)" }}
                              >
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
                  setForm(EMPTY_FORM);
                  setFormError(null);
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
                           value={form.first_name}
                           onChange={(v) =>
                              setForm((f) => ({ ...f, first_name: v }))
                           }
                           placeholder='Jane'
                        />
                     </Field>
                     <Field label='Last name'>
                        <DcInput
                           value={form.last_name}
                           onChange={(v) =>
                              setForm((f) => ({ ...f, last_name: v }))
                           }
                           placeholder='Doe'
                        />
                     </Field>
                  </div>

                  <Field label='Email'>
                     <DcInput
                        type='email'
                        value={form.email}
                        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                        placeholder='jane@example.com'
                     />
                  </Field>

                  <Field label='Password'>
                     <DcInput
                        type='password'
                        value={form.password}
                        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                        placeholder='Temporary password'
                     />
                  </Field>

                  <Field label='Role'>
                     <Select
                        value={form.role}
                        onValueChange={(v) =>
                           setForm((f) => ({ ...f, role: v ?? f.role }))
                        }
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value='viewer'>Viewer</SelectItem>
                           <SelectItem value='editor'>Editor</SelectItem>
                           <SelectItem value='admin'>Admin</SelectItem>
                        </SelectContent>
                     </Select>
                  </Field>

                  {formError && (
                     <p
                        className='text-[13px]'
                        style={{ color: "var(--dc-danger)" }}
                     >
                        {formError}
                     </p>
                  )}
               </div>

               <DialogFooter>
                  <DcButton onClick={() => setAddUserOpen(false)}>
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='primary'
                     onClick={handleAddUser}
                     disabled={createMutation.isPending}
                  >
                     {createMutation.isPending ? "Creating…" : "Create User"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Change Role Dialog ─────────────────────────────── */}
         <Dialog
            open={!!roleChangeUser}
            onOpenChange={(o) => !o && setRoleChangeUser(null)}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Change Role</DialogTitle>
               </DialogHeader>
               <p
                  className='text-[13px]'
                  style={{ color: "var(--dc-text-muted)" }}
               >
                  Updating role for{" "}
                  <span
                     className='font-medium'
                     style={{ color: "var(--dc-text)" }}
                  >
                     {roleChangeUser ? displayName(roleChangeUser) : ""}
                  </span>
               </p>
               <Select
                  value={roleChangeValue}
                  onValueChange={(v) =>
                     setRoleChangeValue(v ?? roleChangeValue)
                  }
               >
                  <SelectTrigger>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value='viewer'>Viewer</SelectItem>
                     <SelectItem value='editor'>Editor</SelectItem>
                     <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
               </Select>
               <DialogFooter>
                  <DcButton
                     onClick={() => setRoleChangeUser(null)}
                     disabled={updateRolesMutation.isPending}
                  >
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='primary'
                     onClick={() =>
                        roleChangeUser &&
                        updateRolesMutation.mutate({
                           userId: roleChangeUser.id,
                           roles: [roleChangeValue],
                        })
                     }
                     disabled={updateRolesMutation.isPending}
                  >
                     {updateRolesMutation.isPending ? "Saving…" : "Save"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Inline helpers
// ─────────────────────────────────────────────────────────────────────

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
      style={{
         color: "var(--dc-text-dim)",
         textAlign: align,
         ...style,
      }}
   >
      {children}
   </th>
);

const Td: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
   align?: "left" | "right";
}> = ({ children, style, align = "left" }) => (
   <td
      className='px-4 py-2.5 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", textAlign: align, ...style }}
   >
      {children}
   </td>
);

// Labelled form field — label + input stacked
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

// Design-system input
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
