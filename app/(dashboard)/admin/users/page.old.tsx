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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  MoreVertical,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminService, type AdminUser } from "@/lib/services/adminService";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "viewer",
};

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [twoFaFilter, setTwoFaFilter] = useState<"all" | "enabled" | "disabled">("all");
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

  // Reuses cached data from the admin dashboard page when available.
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
    onError: (err: any) => {
      setFormError(err?.details?.[0] ?? err?.message ?? "Failed to create user");
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

  const forceDisable2faMutation = useMutation({
    mutationFn: (userId: string) => adminService.forceDisable2fa(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      adminService.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setRoleChangeUser(null);
    },
  });

  const allUsers = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const activeCount = allUsers.filter((u) => u.status === "active").length;

  const users = allUsers.filter((u) => {
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
  });

  const formatRelativeTime = (iso?: string) => {
    if (!iso) return "—";
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "editor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "viewer":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "inactive":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const displayName = (u: AdminUser) =>
    `${u.first_name} ${u.last_name}`.trim();

  const initials = (u: AdminUser) =>
    `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase();

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
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Total Users
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : total.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">All registered</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Active Users
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : activeCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              New This Month
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading || !stats ? "—" : stats.new_users_this_month}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Registered in April</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Suspended
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading || !stats ? "—" : stats.suspended_users}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Accounts suspended</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "enabled", "disabled"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={twoFaFilter === f ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setTwoFaFilter(f)}
            >
              {f === "enabled" && <ShieldCheck className="h-3.5 w-3.5" />}
              {f === "disabled" && <ShieldOff className="h-3.5 w-3.5" />}
              {f === "all" ? "All" : `2FA ${f}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading users…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    2FA
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {initials(u)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{displayName(u)}</p>
                          <p className="text-sm text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(u.roles[0] ?? "")}
                      >
                        {u.roles[0] ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(u.status)}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {u.documents_count ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.totp_enabled ? (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(u.last_active_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(u.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-accent">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setRoleChangeUser(u);
                              setRoleChangeValue(u.roles[0] ?? "viewer");
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          {u.totp_enabled && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => forceDisable2faMutation.mutate(u.id)}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Disable 2FA
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={(o) => { setAddUserOpen(o); if (!o) { setForm(EMPTY_FORM); setFormError(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Temporary password"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v ?? f.role }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleChangeUser} onOpenChange={(o) => !o && setRoleChangeUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Updating role for{" "}
            <span className="font-medium text-foreground">
              {roleChangeUser ? `${roleChangeUser.first_name} ${roleChangeUser.last_name}`.trim() : ""}
            </span>
          </p>
          <Select value={roleChangeValue} onValueChange={(v) => setRoleChangeValue(v ?? roleChangeValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeUser(null)} disabled={updateRolesMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                roleChangeUser &&
                updateRolesMutation.mutate({ userId: roleChangeUser.id, roles: [roleChangeValue] })
              }
              disabled={updateRolesMutation.isPending}
            >
              {updateRolesMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
