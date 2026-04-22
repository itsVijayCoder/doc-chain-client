"use client";

import { FC, ReactNode, useEffect, useState } from "react";
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
   Check,
   Copy,
   Download,
   Eye,
   FileEdit,
   FileSearch,
   Folder,
   KeyRound,
   LayoutDashboard,
   MessageSquare,
   MoreHorizontal,
   Pencil,
   Plus,
   Puzzle,
   Settings,
   Share2,
   ShieldCheck,
   Trash2,
   Upload,
   Users,
} from "lucide-react";
import {
   roleService,
   type Role,
   type CreateRoleRequest,
} from "@/lib/services/roleService";
import { usePermissionsCatalog } from "@/lib/hooks/usePermissionsCatalog";
import {
   DcButton,
   Panel,
   PageHead,
} from "@/components/design/primitives";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────
const ROLE_COLORS = [
   "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
   "#f97316", "#eab308", "#22c55e", "#14b8a6",
   "#3b82f6", "#0ea5e9", "#64748b", "#78716c",
];

const PERMISSION_ICONS: Record<string, ReactNode> = {
   can_upload:          <Upload size={12} strokeWidth={1.75} />,
   can_edit:            <FileEdit size={12} strokeWidth={1.75} />,
   can_delete:          <Trash2 size={12} strokeWidth={1.75} />,
   can_share:           <Share2 size={12} strokeWidth={1.75} />,
   can_download:        <Download size={12} strokeWidth={1.75} />,
   can_comment:         <MessageSquare size={12} strokeWidth={1.75} />,
   can_admin:           <LayoutDashboard size={12} strokeWidth={1.75} />,
   can_manage_users:    <Users size={12} strokeWidth={1.75} />,
   can_manage_roles:    <KeyRound size={12} strokeWidth={1.75} />,
   can_view_audit:      <FileSearch size={12} strokeWidth={1.75} />,
   can_manage_settings: <Settings size={12} strokeWidth={1.75} />,
};

const PERMISSION_GROUPS = [
   {
      label: "Documents",
      icon: <ShieldCheck size={12} strokeWidth={1.75} />,
      permissions: [
         "can_upload",
         "can_edit",
         "can_delete",
         "can_share",
         "can_download",
         "can_comment",
      ],
   },
   {
      label: "Administration",
      icon: <KeyRound size={12} strokeWidth={1.75} />,
      permissions: [
         "can_admin",
         "can_manage_users",
         "can_manage_roles",
         "can_view_audit",
         "can_manage_settings",
      ],
   },
];

const EMPTY_FORM: CreateRoleRequest = {
   name: "",
   description: "",
   color: ROLE_COLORS[0],
   permissions: [],
};

// Short labels for the table pills — full labels (from PERMISSION_LABELS)
// are too verbose for inline badges. Uses the same keys as the backend enum.
const PERMISSION_SHORT: Record<string, string> = {
   can_upload: "Upload",
   can_edit: "Edit",
   can_delete: "Delete",
   can_share: "Share",
   can_download: "Download",
   can_comment: "Comment",
   can_admin: "Admin",
   can_manage_users: "Users",
   can_manage_roles: "Roles",
   can_view_audit: "Audit",
   can_manage_settings: "Settings",
};

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AdminRolesPage() {
   const { user, isLoading: authLoading } = useAuth();
   const queryClient = useQueryClient();

   // Core labels/groups merged with whatever active modules declared. Labels
   // resolve bookmark.create → "Create bookmarks"; groups add one picker
   // section per module so its permissions are actually assignable.
   const { labels: permissionLabels, moduleGroups } = usePermissionsCatalog();
   const allPermissionGroups = [...PERMISSION_GROUPS, ...moduleGroups];

   const [modalOpen, setModalOpen] = useState(false);
   const [editingRole, setEditingRole] = useState<Role | null>(null);
   const [form, setForm] = useState<CreateRoleRequest>(EMPTY_FORM);
   const [formError, setFormError] = useState<string | null>(null);
   const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) redirect("/dashboard");
   }, [user, authLoading]);

   const { data: roles = [], isLoading } = useQuery({
      queryKey: ["admin", "roles"],
      queryFn: () => roleService.listRoles(),
      enabled: !!user && isAdmin(user.role),
      staleTime: 30_000,
   });

   const createMutation = useMutation({
      mutationFn: (req: CreateRoleRequest) => roleService.createRole(req),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
         closeModal();
      },
      onError: (e: { message?: string }) =>
         setFormError(e.message ?? "Failed to create role"),
   });

   const updateMutation = useMutation({
      mutationFn: ({ id, req }: { id: string; req: CreateRoleRequest }) =>
         roleService.updateRole(id, req),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
         closeModal();
      },
      onError: (e: { message?: string }) =>
         setFormError(e.message ?? "Failed to update role"),
   });

   const deleteMutation = useMutation({
      mutationFn: (id: string) => roleService.deleteRole(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
         setDeleteConfirm(null);
      },
   });

   function openCreate() {
      setEditingRole(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      setModalOpen(true);
   }

   function openEdit(role: Role) {
      setEditingRole(role);
      setForm({
         name: role.name,
         description: role.description ?? "",
         color: (role.color || ROLE_COLORS[0]).toLowerCase(),
         permissions: [...role.permissions],
      });
      setFormError(null);
      setModalOpen(true);
   }

   function closeModal() {
      setModalOpen(false);
      setEditingRole(null);
      setForm(EMPTY_FORM);
      setFormError(null);
   }

   function togglePermission(perm: string) {
      setForm((f) => ({
         ...f,
         permissions: f.permissions.includes(perm)
            ? f.permissions.filter((p) => p !== perm)
            : [...f.permissions, perm],
      }));
   }

   function toggleGroup(perms: string[], select: boolean) {
      setForm((f) => ({
         ...f,
         permissions: select
            ? [...new Set([...f.permissions, ...perms])]
            : f.permissions.filter((p) => !perms.includes(p)),
      }));
   }

   function handleSubmit() {
      if (!form.name.trim()) {
         setFormError("Name is required");
         return;
      }
      if (editingRole) {
         updateMutation.mutate({ id: editingRole.id, req: form });
      } else {
         createMutation.mutate(form);
      }
   }

   const isPending = createMutation.isPending || updateMutation.isPending;

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

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Role Management'
            titleIcon={<KeyRound size={22} strokeWidth={1.75} />}
            subtitle={
               <span>Define roles and assign permissions to control access</span>
            }
            actions={
               <DcButton
                  variant='primary'
                  icon={<Plus size={14} strokeWidth={2} />}
                  onClick={openCreate}
               >
                  Create Role
               </DcButton>
            }
         />

         <Panel title='Roles' flushBody>
            {isLoading ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading roles…
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
                           <Th>Role</Th>
                           <Th>Type</Th>
                           <Th>Members</Th>
                           <Th>Permissions</Th>
                           <Th>Folder access</Th>
                           <Th style={{ width: 120 }} align='right'>
                              Actions
                           </Th>
                        </tr>
                     </thead>
                     <tbody>
                        {roles.map((role) => {
                           const isSystem = role.is_system === true;
                           const memberCount = role.member_count ?? 0;
                           const folderCount = role.folder_access?.length ?? 0;
                           // Pick 3 most meaningful permissions to surface in the
                           // table. Order in PERMISSION_SHORT is intentional:
                           // broad capabilities first (Upload/Edit/Admin) so the
                           // pills communicate the role's reach at a glance.
                           const orderedPerms = Object.keys(PERMISSION_SHORT).filter(
                              (k) => role.permissions.includes(k)
                           );
                           const shownPerms = orderedPerms.slice(0, 3);
                           const remainingPerms =
                              role.permissions.length - shownPerms.length;

                           return (
                              <tr
                                 key={role.id}
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
                                    <div className='flex items-center gap-2.5'>
                                       <div
                                          className='w-2 h-2 rounded-full shrink-0'
                                          style={{
                                             background: role.color || "#64748b",
                                             boxShadow: `0 0 0 3px ${role.color || "#64748b"}22`,
                                          }}
                                       />
                                       <div className='min-w-0'>
                                          <div
                                             className='font-semibold'
                                             style={{ color: "var(--dc-text)" }}
                                          >
                                             {role.name}
                                          </div>
                                          {role.description && (
                                             <div
                                                className='text-[11px] mt-0.5 truncate'
                                                style={{ color: "var(--dc-text-dim)" }}
                                             >
                                                {role.description}
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </Td>

                                 {/* Type — System (muted) or Custom (tinted by role color) */}
                                 <Td>
                                    {isSystem ? (
                                       <span
                                          className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                                          style={{
                                             background: "var(--dc-surface-2)",
                                             color: "var(--dc-text-muted)",
                                             border: "1px solid var(--dc-border)",
                                          }}
                                       >
                                          System
                                       </span>
                                    ) : (
                                       <span
                                          className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                                          style={{
                                             background: `${role.color || "#64748b"}18`,
                                             color: role.color || "#64748b",
                                             border: `1px solid ${role.color || "#64748b"}44`,
                                          }}
                                       >
                                          Custom
                                       </span>
                                    )}
                                 </Td>

                                 {/* Members — count + icon (future: click to reveal) */}
                                 <Td style={{ color: "var(--dc-text-muted)" }}>
                                    <span className='inline-flex items-center gap-1.5 tabular-nums'>
                                       <Users size={12} strokeWidth={1.75} />
                                       <span
                                          style={{
                                             color:
                                                memberCount > 0
                                                   ? "var(--dc-text)"
                                                   : "var(--dc-text-dim)",
                                             fontWeight: memberCount > 0 ? 500 : 400,
                                          }}
                                       >
                                          {memberCount}
                                       </span>
                                    </span>
                                 </Td>

                                 {/* Permissions — 3 inline pills + "+N more" */}
                                 <Td>
                                    <div className='flex items-center gap-1 flex-wrap'>
                                       {shownPerms.length === 0 ? (
                                          <span
                                             style={{ color: "var(--dc-text-faint)" }}
                                          >
                                             none
                                          </span>
                                       ) : (
                                          <>
                                             {shownPerms.map((p) => (
                                                <PermPill key={p}>
                                                   {PERMISSION_SHORT[p]}
                                                </PermPill>
                                             ))}
                                             {remainingPerms > 0 && (
                                                <span
                                                   className='text-[10.5px] font-medium tabular-nums'
                                                   style={{
                                                      color: "var(--dc-text-dim)",
                                                   }}
                                                   title={
                                                      orderedPerms
                                                         .slice(3)
                                                         .map(
                                                            (p) =>
                                                               permissionLabels[p] ?? p
                                                         )
                                                         .join(", ") +
                                                      (role.permissions.length >
                                                      orderedPerms.length
                                                         ? ", …"
                                                         : "")
                                                   }
                                                >
                                                   +{remainingPerms} more
                                                </span>
                                             )}
                                          </>
                                       )}
                                    </div>
                                 </Td>

                                 {/* Folder access — scope indicator. Empty = all folders. */}
                                 <Td>
                                    <span
                                       className='inline-flex items-center gap-1.5 text-[12px]'
                                       style={{
                                          color:
                                             folderCount > 0
                                                ? "var(--dc-text)"
                                                : "var(--dc-text-muted)",
                                       }}
                                    >
                                       <Folder
                                          size={12}
                                          strokeWidth={1.75}
                                          style={{ color: "var(--dc-text-dim)" }}
                                       />
                                       {folderCount === 0
                                          ? "All folders"
                                          : `${folderCount} folder${
                                               folderCount === 1 ? "" : "s"
                                            }`}
                                    </span>
                                 </Td>

                                 {/* Actions — Edit inline, ⋮ for everything else */}
                                 <Td align='right'>
                                    <div className='inline-flex items-center gap-1 justify-end'>
                                       <DcButton
                                          variant='ghost'
                                          size='sm'
                                          icon={<Pencil size={13} strokeWidth={1.75} />}
                                          onClick={() => openEdit(role)}
                                       >
                                          Edit
                                       </DcButton>

                                       <DropdownMenu>
                                          <DropdownMenuTrigger
                                             aria-label='More role actions'
                                             className='w-[26px] h-[26px] rounded-md inline-flex items-center justify-center transition-colors'
                                             style={{
                                                background: "var(--dc-surface)",
                                                border:
                                                   "1px solid var(--dc-border)",
                                                color: "var(--dc-text-muted)",
                                             }}
                                          >
                                             <MoreHorizontal
                                                size={13}
                                                strokeWidth={1.75}
                                             />
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align='end'>
                                             <DropdownMenuItem
                                                onClick={() => {
                                                   // Seed the create form with this role's
                                                   // fields minus its name, so user just
                                                   // types a new name + saves.
                                                   setEditingRole(null);
                                                   setForm({
                                                      name: `${role.name} (copy)`,
                                                      description: role.description ?? "",
                                                      color: (role.color || ROLE_COLORS[0]).toLowerCase(),
                                                      permissions: [...role.permissions],
                                                   });
                                                   setFormError(null);
                                                   setModalOpen(true);
                                                }}
                                             >
                                                <Copy className='mr-2 h-4 w-4' />
                                                Duplicate
                                             </DropdownMenuItem>
                                             <DropdownMenuItem
                                                disabled={memberCount === 0}
                                                onClick={() => {
                                                   // TODO: filter the users list by this
                                                   // role. For now we just deep-link to
                                                   // the users page — they can search.
                                                   window.location.href =
                                                      "/admin/users";
                                                }}
                                             >
                                                <Eye className='mr-2 h-4 w-4' />
                                                View members
                                                {memberCount === 0 && (
                                                   <span
                                                      className='ml-auto text-[11px]'
                                                      style={{
                                                         color: "var(--dc-text-faint)",
                                                      }}
                                                   >
                                                      none
                                                   </span>
                                                )}
                                             </DropdownMenuItem>
                                             {!isSystem && (
                                                <>
                                                   <DropdownMenuSeparator />
                                                   <DropdownMenuItem
                                                      variant='destructive'
                                                      onClick={() =>
                                                         setDeleteConfirm(role)
                                                      }
                                                   >
                                                      <Trash2 className='mr-2 h-4 w-4' />
                                                      Delete
                                                   </DropdownMenuItem>
                                                </>
                                             )}
                                          </DropdownMenuContent>
                                       </DropdownMenu>
                                    </div>
                                 </Td>
                              </tr>
                           );
                        })}
                        {roles.length === 0 && (
                           <tr>
                              <td
                                 colSpan={6}
                                 className='py-12 text-center text-[13px]'
                                 style={{ color: "var(--dc-text-dim)" }}
                              >
                                 No roles found. Create your first role to get
                                 started.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </Panel>

         {/* ── Create / Edit Role modal ─────────────────────────── */}
         <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
            <DialogContent className='sm:max-w-xl'>
               <DialogHeader>
                  <DialogTitle>
                     {editingRole ? "Edit Role" : "Create Role"}
                  </DialogTitle>
               </DialogHeader>

               <div className='space-y-5'>
                  {/* Live preview */}
                  <RolePreview name={form.name} color={form.color || ROLE_COLORS[0]} />

                  {/* Name + Description */}
                  <div className='grid grid-cols-2 gap-3'>
                     <Field label='Name'>
                        <DcInput
                           value={form.name}
                           onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                           placeholder='e.g. Content Editor'
                           autoFocus
                        />
                     </Field>
                     <Field
                        label={
                           <>
                              Description{" "}
                              <span
                                 className='font-normal text-[11px]'
                                 style={{ color: "var(--dc-text-dim)" }}
                              >
                                 (optional)
                              </span>
                           </>
                        }
                     >
                        <DcInput
                           value={form.description ?? ""}
                           onChange={(v) =>
                              setForm((f) => ({ ...f, description: v }))
                           }
                           placeholder='What is this role for?'
                        />
                     </Field>
                  </div>

                  {/* Color picker */}
                  <Field label='Color'>
                     <ColorPicker
                        value={form.color || ROLE_COLORS[0]}
                        onChange={(c) => setForm((f) => ({ ...f, color: c }))}
                     />
                  </Field>

                  {/* Permissions */}
                  <div className='space-y-2'>
                     <div className='flex items-center justify-between'>
                        <label
                           className='block text-[12px] font-semibold'
                           style={{ color: "var(--dc-text)" }}
                        >
                           Permissions
                        </label>
                        <span
                           className='text-[11.5px]'
                           style={{ color: "var(--dc-text-dim)" }}
                        >
                           {form.permissions.length} selected
                        </span>
                     </div>
                     <div className='max-h-[40vh] overflow-y-auto space-y-3 pr-1'>
                        {allPermissionGroups.map((group) => (
                           <PermissionGroup
                              key={group.label}
                              label={group.label}
                              icon={
                                 group.icon ?? (
                                    <Puzzle size={12} strokeWidth={1.75} />
                                 )
                              }
                              permissions={group.permissions}
                              selected={form.permissions}
                              labels={permissionLabels}
                              onToggle={togglePermission}
                              onToggleAll={toggleGroup}
                           />
                        ))}
                     </div>
                  </div>

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
                  <DcButton onClick={closeModal} disabled={isPending}>
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='primary'
                     onClick={handleSubmit}
                     disabled={isPending}
                  >
                     {isPending
                        ? editingRole
                           ? "Saving…"
                           : "Creating…"
                        : editingRole
                        ? "Save Changes"
                        : "Create Role"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Delete confirmation ─────────────────────────────── */}
         <Dialog
            open={!!deleteConfirm}
            onOpenChange={(v) => !v && setDeleteConfirm(null)}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Delete Role</DialogTitle>
               </DialogHeader>
               <p
                  className='text-[13px]'
                  style={{ color: "var(--dc-text-muted)" }}
               >
                  Are you sure you want to delete{" "}
                  <span
                     className='font-semibold'
                     style={{ color: "var(--dc-text)" }}
                  >
                     {deleteConfirm?.name}
                  </span>
                  ? Users assigned this role will lose its permissions.
               </p>
               <DialogFooter>
                  <DcButton
                     onClick={() => setDeleteConfirm(null)}
                     disabled={deleteMutation.isPending}
                  >
                     Cancel
                  </DcButton>
                  <DcButton
                     variant='danger'
                     onClick={() =>
                        deleteConfirm &&
                        deleteMutation.mutate(deleteConfirm.id)
                     }
                     disabled={deleteMutation.isPending}
                  >
                     {deleteMutation.isPending ? "Deleting…" : "Delete"}
                  </DcButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Inline components
// ─────────────────────────────────────────────────────────────────────

// Live preview badge — full-width strip tinted by the chosen color, shows
// a solid color dot + role name (or placeholder) in the role's color.
function RolePreview({ name, color }: { name: string; color: string }) {
   const hasName = !!name.trim();
   return (
      <div
         className='flex items-center gap-3 px-5 py-4 rounded-xl'
         style={{
            background: `${color}14`,
            border: `1px solid ${color}66`,
         }}
      >
         <div
            className='w-3.5 h-3.5 rounded-full shrink-0'
            style={{ background: color }}
         />
         <span
            className={cn("text-[16px] font-semibold tracking-[-0.01em]")}
            style={{ color: hasName ? color : `${color}88` }}
         >
            {hasName ? name : "Role name…"}
         </span>
      </div>
   );
}

// Color picker — rounded-square swatches with a white ring on the selected
// color, matching the design reference.
function ColorPicker({
   value,
   onChange,
}: {
   value: string;
   onChange: (c: string) => void;
}) {
   return (
      <div className='flex flex-wrap gap-2'>
         {ROLE_COLORS.map((c) => {
            const selected = value.toLowerCase() === c.toLowerCase();
            return (
               <button
                  key={c}
                  type='button'
                  aria-label={`Select color ${c}`}
                  aria-pressed={selected}
                  onClick={() => onChange(c)}
                  className='w-9 h-9 rounded-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none'
                  style={{
                     background: c,
                     // Selected: 2px elevated bg gap + 2px white ring outside
                     //  → makes the swatch "pop" off the dialog bg
                     boxShadow: selected
                        ? `0 0 0 2px var(--dc-elevated), 0 0 0 4px var(--dc-text)`
                        : "none",
                  }}
               />
            );
         })}
      </div>
   );
}

// Permission group — 2-col grid of selectable permission cards. Each card
// combines a checkbox-tile + permission icon + label. Selected cards get an
// accent-tinted background and border; the checkbox tile fills solid accent.
function PermissionGroup({
   label,
   icon,
   permissions,
   selected,
   labels,
   onToggle,
   onToggleAll,
}: {
   label: string;
   icon: ReactNode;
   permissions: string[];
   selected: string[];
   labels: Record<string, string>;
   onToggle: (p: string) => void;
   onToggleAll: (perms: string[], select: boolean) => void;
}) {
   const allSelected = permissions.every((p) => selected.includes(p));
   const count = selected.filter((p) => permissions.includes(p)).length;

   return (
      <div className='space-y-2'>
         <div className='flex items-center justify-between px-0.5'>
            <div
               className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]'
               style={{ color: "var(--dc-text-muted)" }}
            >
               {icon}
               <span>{label}</span>
               <span
                  className='normal-case font-normal tabular-nums'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  ({count}/{permissions.length})
               </span>
            </div>
            <button
               type='button'
               onClick={() => onToggleAll(permissions, !allSelected)}
               className='text-[12px] font-medium transition-colors hover:underline'
               style={{ color: "var(--dc-accent)" }}
            >
               {allSelected ? "Deselect all" : "Select all"}
            </button>
         </div>

         <div className='grid grid-cols-2 gap-2'>
            {permissions.map((perm) => {
               const checked = selected.includes(perm);
               return (
                  <button
                     key={perm}
                     type='button'
                     onClick={() => onToggle(perm)}
                     aria-pressed={checked}
                     className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all'
                     style={{
                        background: checked
                           ? "var(--dc-accent-soft)"
                           : "var(--dc-surface-2)",
                        border: `1px solid ${
                           checked ? "var(--dc-accent-border)" : "var(--dc-border)"
                        }`,
                        color: checked ? "var(--dc-text)" : "var(--dc-text-muted)",
                     }}
                     onMouseEnter={(e) => {
                        if (!checked) {
                           e.currentTarget.style.background =
                              "var(--dc-surface-3)";
                           e.currentTarget.style.borderColor =
                              "var(--dc-border-strong)";
                        }
                     }}
                     onMouseLeave={(e) => {
                        if (!checked) {
                           e.currentTarget.style.background =
                              "var(--dc-surface-2)";
                           e.currentTarget.style.borderColor = "var(--dc-border)";
                        }
                     }}
                  >
                     {/* Checkbox tile — solid accent when checked, outlined otherwise */}
                     <span
                        className='w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 transition-colors'
                        style={{
                           background: checked
                              ? "var(--dc-accent)"
                              : "transparent",
                           border: checked
                              ? "1.5px solid var(--dc-accent)"
                              : "1.5px solid var(--dc-border-bright)",
                        }}
                     />
                     {/* Permission icon — green when checked, muted otherwise */}
                     <span
                        className='shrink-0'
                        style={{
                           color: checked
                              ? "var(--dc-accent)"
                              : "var(--dc-text-muted)",
                        }}
                     >
                        {PERMISSION_ICONS[perm]}
                     </span>
                     <span
                        className={cn(
                           "text-[13px] leading-snug truncate",
                           checked && "font-medium"
                        )}
                     >
                        {labels[perm] ?? perm}
                     </span>
                  </button>
               );
            })}
         </div>
      </div>
   );
}

// Small badge for inline permission display in the table
const PermPill: FC<{ children: ReactNode }> = ({ children }) => (
   <span
      className='inline-flex items-center h-[18px] px-1.5 rounded text-[10.5px] font-medium whitespace-nowrap'
      style={{
         background: "var(--dc-surface-2)",
         color: "var(--dc-text-muted)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {children}
   </span>
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
}> = ({ children, style, align = "left" }) => (
   <td
      className='px-4 py-3 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", textAlign: align, ...style }}
   >
      {children}
   </td>
);

const Field: FC<{ label: ReactNode; children: ReactNode }> = ({
   label,
   children,
}) => (
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
   autoFocus?: boolean;
}> = ({ value, onChange, placeholder, autoFocus }) => (
   <input
      type='text'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
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
