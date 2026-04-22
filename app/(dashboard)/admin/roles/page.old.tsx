"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldCheck,
  Upload,
  FileEdit,
  Share2,
  Download,
  MessageSquare,
  LayoutDashboard,
  Settings,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  roleService,
  type Role,
  type CreateRoleRequest,
  PERMISSION_LABELS,
} from "@/lib/services/roleService";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#0ea5e9", "#64748b", "#78716c",
];

const PERMISSION_ICONS: Record<string, React.ReactNode> = {
  can_upload:          <Upload size={12} />,
  can_edit:            <FileEdit size={12} />,
  can_delete:          <Trash2 size={12} />,
  can_share:           <Share2 size={12} />,
  can_download:        <Download size={12} />,
  can_comment:         <MessageSquare size={12} />,
  can_admin:           <LayoutDashboard size={12} />,
  can_manage_users:    <Users size={12} />,
  can_manage_roles:    <KeyRound size={12} />,
  can_view_audit:      <FileSearch size={12} />,
  can_manage_settings: <Settings size={12} />,
};

const PERMISSION_GROUPS_RICH = [
  {
    label: "Documents",
    icon: <ShieldCheck size={13} />,
    permissions: ["can_upload", "can_edit", "can_delete", "can_share", "can_download", "can_comment"],
  },
  {
    label: "Administration",
    icon: <KeyRound size={13} />,
    permissions: ["can_admin", "can_manage_users", "can_manage_roles", "can_view_audit", "can_manage_settings"],
  },
];

const EMPTY_FORM: CreateRoleRequest = {
  name: "",
  description: "",
  color: ROLE_COLORS[0],
  permissions: [],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RolePreview({ name, color }: { name: string; color: string }) {
  const hasName = !!name.trim();
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}15` }}
    >
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}35` }}
      />
      <span
        className={cn("text-sm font-semibold", !hasName && "opacity-40")}
        style={{ color }}
      >
        {hasName ? name : "Role name…"}
      </span>
      {hasName && (
        <span className="ml-auto text-xs opacity-50" style={{ color }}>
          preview
        </span>
      )}
    </div>
  );
}

// Pure box-shadow selection ring — no overflow issues, works in dark/light mode.
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {ROLE_COLORS.map((c) => {
        const selected = value.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-8 h-8 rounded-lg transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none"
            style={{
              backgroundColor: c,
              boxShadow: selected ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
              transform: selected ? "scale(1.15)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

// 2-column grid per group — no horizontal clipping, compact, scannable.
function PermissionGroup({
  label, icon, permissions, selected, onToggle, onToggleAll,
}: {
  label: string;
  icon: React.ReactNode;
  permissions: string[];
  selected: string[];
  onToggle: (p: string) => void;
  onToggleAll: (perms: string[], select: boolean) => void;
}) {
  const allSelected = permissions.every((p) => selected.includes(p));
  const count = selected.filter((p) => permissions.includes(p)).length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          <span>{label}</span>
          <span className="normal-case font-normal">({count}/{permissions.length})</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleAll(permissions, !allSelected)}
          className="text-xs text-primary hover:underline font-medium"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* 2-column grid: each permission fits ~220px, no wrapping for any label */}
      <div className="grid grid-cols-2 gap-px rounded-lg border overflow-hidden bg-border">
        {permissions.map((perm) => {
          const checked = selected.includes(perm);
          return (
            <label
              key={perm}
              htmlFor={`perm-${perm}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors bg-card",
                checked ? "bg-primary/10" : "hover:bg-muted/60"
              )}
            >
              <Checkbox
                id={`perm-${perm}`}
                checked={checked}
                onCheckedChange={() => onToggle(perm)}
                className="shrink-0"
              />
              <span className={cn("shrink-0", checked ? "text-primary" : "text-muted-foreground")}>
                {PERMISSION_ICONS[perm]}
              </span>
              <span className={cn("text-xs leading-snug truncate", checked && "font-medium text-foreground")}>
                {PERMISSION_LABELS[perm] ?? perm}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }); closeModal(); },
    onError: (e: { message?: string }) => setFormError(e.message ?? "Failed to create role"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: string; req: CreateRoleRequest }) => roleService.updateRole(id, req),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }); closeModal(); },
    onError: (e: { message?: string }) => setFormError(e.message ?? "Failed to update role"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }); setDeleteConfirm(null); },
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
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, req: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <KeyRound className="h-8 w-8" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Define roles and assign permissions to control access
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Roles</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading roles…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Members</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Permissions</th>
                  <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: role.color || "#64748b" }}
                        />
                        <div>
                          <p className="font-medium text-sm">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={role.is_system ? "secondary" : "outline"} className="capitalize">
                        {role.is_system ? "system" : "custom"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users size={14} /> {role.member_count ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ShieldCheck size={14} /> {role.permissions.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                          <Pencil size={14} className="mr-1" /> Edit
                        </Button>
                        {!role.is_system && (
                          <Button
                            variant="ghost" size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(role)}
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No roles found. Create your first role to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Live preview */}
            <RolePreview name={form.name} color={form.color || ROLE_COLORS[0]} />

            {/* Name + Description side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Content Editor"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-desc">
                  Description{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="role-desc"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this role for?"
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker
                value={form.color || ROLE_COLORS[0]}
                onChange={(c) => setForm((f) => ({ ...f, color: c }))}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-xs text-muted-foreground">
                  {form.permissions.length} selected
                </span>
              </div>
              {/* Scrollable permission area */}
              <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-1">
                {PERMISSION_GROUPS_RICH.map((group) => (
                  <PermissionGroup
                    key={group.label}
                    label={group.label}
                    icon={group.icon}
                    permissions={group.permissions}
                    selected={form.permissions}
                    onToggle={togglePermission}
                    onToggleAll={toggleGroup}
                  />
                ))}
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? editingRole ? "Saving…" : "Creating…"
                : editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteConfirm?.name}</span>?
            Users assigned this role will lose its permissions.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
