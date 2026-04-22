"use client";

import { FC, useMemo, useRef, useState } from "react";
import {
   Loader2,
   Search,
   Trash2,
   User as UserIcon,
   Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
   Avatar,
   AvatarFallback,
} from "@/components/ui/avatar";
import { useUserSearch } from "@/lib/hooks/useUsers";
import { useMyGroups } from "@/lib/hooks/useGroups";
import {
   useDocumentPermissions,
   useGrantPermission,
   useRevokePermission,
   useUpdatePermissionLevel,
} from "@/lib/hooks/usePermissions";
import { useToast } from "@/lib/hooks/useToast";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/types";
import type { PermissionLevel } from "@/lib/services/permissionService";
import type { PublicUser } from "@/lib/services/userService";
import type { Group } from "@/lib/services/groupService";

interface Props {
   documentId: string;
}

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; hint: string }[] = [
   { value: "view", label: "View", hint: "Read the document" },
   { value: "comment", label: "Comment", hint: "Read + leave comments" },
   { value: "edit", label: "Edit", hint: "Upload new versions + metadata" },
   { value: "admin", label: "Admin", hint: "Full control including sharing" },
];

type Candidate =
   | { kind: "user"; user: PublicUser }
   | { kind: "group"; group: Group };

function candidateLabel(c: Candidate): string {
   return c.kind === "user" ? c.user.name : c.group.name;
}

function candidateSublabel(c: Candidate): string {
   if (c.kind === "user") return c.user.email;
   return c.group.memberCount === 1
      ? "1 member"
      : `${c.group.memberCount} members`;
}

export const PermissionsPanel: FC<Props> = ({ documentId }) => {
   const toast = useToast();

   const [query, setQuery] = useState("");
   const [selected, setSelected] = useState<Candidate | null>(null);
   const [permission, setPermission] = useState<PermissionLevel>("view");
   const [popoverOpen, setPopoverOpen] = useState(false);

   const userSearch = useUserSearch(query);
   const myGroups = useMyGroups();

   const permissionsQuery = useDocumentPermissions(documentId);
   const grantMutation = useGrantPermission(documentId);
   const updateMutation = useUpdatePermissionLevel(documentId);
   const revokeMutation = useRevokePermission(documentId);

   // Build combined search results: users from server + groups filtered
   // client-side (groups list is small and fetched once).
   const candidates: Candidate[] = useMemo(() => {
      const q = query.trim().toLowerCase();
      const filteredGroups = q
         ? (myGroups.data ?? []).filter((g) =>
              g.name.toLowerCase().includes(q)
           )
         : [];
      const userCandidates: Candidate[] = (userSearch.data ?? []).map((u) => ({
         kind: "user",
         user: u,
      }));
      const groupCandidates: Candidate[] = filteredGroups.map((g) => ({
         kind: "group",
         group: g,
      }));
      return [...groupCandidates, ...userCandidates];
   }, [query, userSearch.data, myGroups.data]);

   // Filter out subjects already granted access — prevents duplicate-grant 400s.
   const grantedSubjectIds = useMemo(() => {
      const set = new Set<string>();
      for (const p of permissionsQuery.data ?? []) set.add(p.subjectId);
      return set;
   }, [permissionsQuery.data]);

   const visibleCandidates = useMemo(
      () => candidates.filter((c) => {
         const id = c.kind === "user" ? c.user.id : c.group.id;
         return !grantedSubjectIds.has(id);
      }),
      [candidates, grantedSubjectIds]
   );

   const pickCandidate = (c: Candidate) => {
      setSelected(c);
      setQuery(candidateLabel(c));
      setPopoverOpen(false);
   };

   const resetForm = () => {
      setSelected(null);
      setQuery("");
      setPermission("view");
   };

   const handleGrant = async () => {
      if (!selected) return;
      try {
         await grantMutation.mutateAsync(
            selected.kind === "user"
               ? { userId: selected.user.id, permission }
               : { groupId: selected.group.id, permission }
         );
         toast.success(
            "Access granted",
            `${candidateLabel(selected)} can now ${permission}`
         );
         resetForm();
      } catch (err) {
         const apiErr = err as ApiError;
         if (apiErr?.code === "PERMISSION_ALREADY_EXISTS") {
            toast.error(
               "Already shared",
               `${candidateLabel(selected)} already has access`
            );
            return;
         }
         toast.error(
            "Grant failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleLevelChange = async (
      permissionId: string,
      next: PermissionLevel
   ) => {
      try {
         await updateMutation.mutateAsync({
            permissionId,
            permission: next,
         });
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Update failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleRevoke = async (permissionId: string, label: string) => {
      if (!window.confirm(`Remove access for ${label}?`)) return;
      try {
         await revokeMutation.mutateAsync(permissionId);
         toast.success("Access removed");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Revoke failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   return (
      <div className='space-y-5'>
         {/* Add form */}
         <div className='border rounded-lg p-4 bg-muted/30 space-y-4'>
            <div className='flex items-center gap-2'>
               <UserIcon size={16} className='text-muted-foreground' />
               <h3 className='text-sm font-medium'>Add people or groups</h3>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2'>
               <SearchCombobox
                  query={query}
                  onQueryChange={(q) => {
                     setQuery(q);
                     // Typing after a selection means the user wants to search
                     // again — drop the previous selection.
                     if (selected && q !== candidateLabel(selected)) {
                        setSelected(null);
                     }
                     if (q.trim()) setPopoverOpen(true);
                  }}
                  loading={
                     userSearch.isFetching && query.trim().length > 0
                  }
                  isOpen={popoverOpen && visibleCandidates.length > 0 && !selected}
                  onOpenChange={setPopoverOpen}
                  candidates={visibleCandidates}
                  onPick={pickCandidate}
                  emptyLabel={
                     query.trim()
                        ? userSearch.isFetching
                           ? "Searching…"
                           : "No matches — check spelling or email"
                        : "Type an email, name, or group"
                  }
               />

               <select
                  value={permission}
                  onChange={(e) =>
                     setPermission(e.target.value as PermissionLevel)
                  }
                  className='px-3 py-2 text-sm border rounded-md bg-background'
                  aria-label='Permission level'
                  title={
                     PERMISSION_OPTIONS.find((p) => p.value === permission)
                        ?.hint
                  }
               >
                  {PERMISSION_OPTIONS.map((opt) => (
                     <option key={opt.value} value={opt.value}>
                        {opt.label}
                     </option>
                  ))}
               </select>

               <Button
                  type='button'
                  onClick={handleGrant}
                  disabled={!selected || grantMutation.isPending}
               >
                  {grantMutation.isPending ? "Adding…" : "Add"}
               </Button>
            </div>
         </div>

         {/* Current access */}
         <div className='space-y-3'>
            <div className='flex items-center justify-between'>
               <h3 className='text-sm font-medium'>People with access</h3>
               {permissionsQuery.data && (
                  <span className='text-xs text-muted-foreground'>
                     {permissionsQuery.data.length}
                  </span>
               )}
            </div>

            {permissionsQuery.isLoading && (
               <p className='text-sm text-muted-foreground'>Loading…</p>
            )}

            {permissionsQuery.isError && (
               <p className='text-sm text-(--error)'>
                  {permissionsQuery.error?.message ??
                     "Failed to load permissions"}
               </p>
            )}

            {permissionsQuery.data &&
               permissionsQuery.data.length === 0 && (
                  <p className='text-sm text-muted-foreground'>
                     Only you have access so far.
                  </p>
               )}

            {permissionsQuery.data?.map((p) => (
               <div
                  key={p.id}
                  className='flex items-center gap-3 border rounded-lg p-3'
               >
                  {p.subjectKind === "user" ? (
                     <Avatar className='h-8 w-8'>
                        <AvatarFallback className='text-xs'>
                           {getInitials(p.subjectLabel)}
                        </AvatarFallback>
                     </Avatar>
                  ) : (
                     <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0'>
                        <Users size={14} className='text-muted-foreground' />
                     </div>
                  )}
                  <div className='flex-1 min-w-0'>
                     <p className='text-sm font-medium truncate'>
                        {p.subjectLabel}
                     </p>
                     <p className='text-xs text-muted-foreground capitalize'>
                        {p.subjectKind}
                     </p>
                  </div>
                  <select
                     value={p.permission}
                     onChange={(e) =>
                        handleLevelChange(
                           p.id,
                           e.target.value as PermissionLevel
                        )
                     }
                     disabled={updateMutation.isPending}
                     className='px-2 py-1 text-xs border rounded bg-background'
                  >
                     {PERMISSION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                           {opt.label}
                        </option>
                     ))}
                  </select>
                  <Button
                     type='button'
                     variant='ghost'
                     size='icon'
                     onClick={() => handleRevoke(p.id, p.subjectLabel)}
                     disabled={revokeMutation.isPending}
                     aria-label='Revoke access'
                     title='Revoke'
                  >
                     <Trash2 size={14} className='text-muted-foreground' />
                  </Button>
               </div>
            ))}
         </div>
      </div>
   );
};

// ─────────────────────────────────────────────────────────────────────────
// Inline combobox — small enough to keep colocated. Real cmdk integration
// would buy keyboard navigation + proper a11y; for MVP a click-to-pick
// popover is acceptable and matches the simplicity of the grant form.
// ─────────────────────────────────────────────────────────────────────────

interface ComboboxProps {
   query: string;
   onQueryChange: (q: string) => void;
   loading: boolean;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   candidates: Candidate[];
   onPick: (c: Candidate) => void;
   emptyLabel: string;
}

const SearchCombobox: FC<ComboboxProps> = ({
   query,
   onQueryChange,
   loading,
   isOpen,
   onOpenChange,
   candidates,
   onPick,
   emptyLabel,
}) => {
   const containerRef = useRef<HTMLDivElement>(null);

   // Close popover on click outside.
   const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
         // Small delay lets click events on items fire first.
         setTimeout(() => onOpenChange(false), 120);
      }
   };

   return (
      <div ref={containerRef} className='relative' onBlur={handleBlur}>
         <div className='flex items-center gap-2 border rounded-md bg-background px-2'>
            <Search size={14} className='text-muted-foreground shrink-0' />
            <Input
               value={query}
               onChange={(e) => onQueryChange(e.target.value)}
               onFocus={() => {
                  if (query.trim()) onOpenChange(true);
               }}
               placeholder='Email, name, or group'
               className='border-0 focus-visible:ring-0 px-1 flex-1'
               aria-label='Search people or groups'
            />
            {loading && (
               <Loader2
                  size={14}
                  className='animate-spin text-muted-foreground shrink-0'
               />
            )}
         </div>

         {isOpen && (
            <div className='absolute top-full left-0 right-0 mt-1 z-20 bg-popover border rounded-md shadow-md max-h-72 overflow-auto'>
               {candidates.length === 0 ? (
                  <div className='p-3 text-xs text-muted-foreground'>
                     {emptyLabel}
                  </div>
               ) : (
                  candidates.map((c) => {
                     const id = c.kind === "user" ? c.user.id : c.group.id;
                     return (
                        <button
                           key={`${c.kind}-${id}`}
                           type='button'
                           onClick={() => onPick(c)}
                           className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                           )}
                        >
                           {c.kind === "user" ? (
                              <Avatar className='h-6 w-6'>
                                 <AvatarFallback className='text-[10px]'>
                                    {getInitials(c.user.name)}
                                 </AvatarFallback>
                              </Avatar>
                           ) : (
                              <div className='h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0'>
                                 <Users size={12} />
                              </div>
                           )}
                           <div className='flex-1 min-w-0'>
                              <p className='truncate'>{candidateLabel(c)}</p>
                              <p className='text-[11px] text-muted-foreground truncate'>
                                 {candidateSublabel(c)}
                              </p>
                           </div>
                           <Badge variant='outline' className='shrink-0 text-[10px]'>
                              {c.kind === "user" ? "Person" : "Group"}
                           </Badge>
                        </button>
                     );
                  })
               )}
            </div>
         )}
      </div>
   );
};

