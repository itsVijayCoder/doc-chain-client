"use client";

import { FC, useState } from "react";
import {
   Check,
   Copy,
   Link2,
   Lock,
   ShieldOff,
   Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
   useCreateShareLink,
   useDocumentShareLinks,
   useRevokeShareLink,
} from "@/lib/hooks/useShareLinks";
import { useToast } from "@/lib/hooks/useToast";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/types";
import type { ShareLink } from "@/lib/services/shareLinkService";

interface Props {
   documentId: string;
   documentTitle: string;
}

const EXPIRY_PRESETS = [
   { label: "1 day", value: "24h" },
   { label: "7 days", value: "168h" },
   { label: "30 days", value: "720h" },
] as const;

const MIN_PASSWORD_LENGTH = 4;

export const ShareLinksPanel: FC<Props> = ({ documentId }) => {
   const toast = useToast();
   const linksQuery = useDocumentShareLinks(documentId);
   const createMutation = useCreateShareLink(documentId);
   const revokeMutation = useRevokeShareLink(documentId);

   const [password, setPassword] = useState("");
   const [expiresIn, setExpiresIn] = useState<string>(EXPIRY_PRESETS[1].value);
   const [maxViews, setMaxViews] = useState<string>("");
   const [copiedId, setCopiedId] = useState<string | null>(null);

   // Use the query's own fetch timestamp as the "now" reference for expiry
   // badges. It's truly pure (no Date.now in render) and refreshes on every
   // refetch, which is 30s stale time — accurate enough for a badge.
   const nowMs = linksQuery.dataUpdatedAt || 0;

   const passwordInvalid =
      password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
   const canSubmit =
      password.length >= MIN_PASSWORD_LENGTH && !createMutation.isPending;

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      const parsedMaxViews = maxViews.trim()
         ? Math.max(1, parseInt(maxViews, 10) || 0)
         : undefined;
      try {
         const link = await createMutation.mutateAsync({
            password,
            expiresIn,
            maxViews: parsedMaxViews,
         });
         toast.success("Share link created", "Copy the URL and share");
         setPassword("");
         setMaxViews("");
         // Auto-copy the newly-created URL for convenience
         try {
            await navigator.clipboard.writeText(link.url);
            setCopiedId(link.id);
            setTimeout(() => setCopiedId(null), 2000);
         } catch {
            // Clipboard rejections are non-fatal — users can copy manually
         }
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Create link failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleCopy = async (link: ShareLink) => {
      try {
         await navigator.clipboard.writeText(link.url);
         setCopiedId(link.id);
         toast.success("Link copied");
         setTimeout(() => setCopiedId(null), 2000);
      } catch {
         toast.error("Copy failed", "Your browser blocked clipboard access");
      }
   };

   const handleRevoke = async (link: ShareLink) => {
      if (
         !window.confirm(
            "Revoke this share link? Anyone holding it will lose access immediately."
         )
      )
         return;
      try {
         await revokeMutation.mutateAsync(link.id);
         toast.success("Link revoked");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Revoke failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   return (
      <div className='space-y-6'>
         {/* Create form */}
         <form
            onSubmit={handleCreate}
            className='border rounded-lg p-4 bg-muted/30 space-y-4'
         >
            <div className='flex items-center gap-2'>
               <Link2 size={16} className='text-muted-foreground' />
               <h3 className='text-sm font-medium'>Create share link</h3>
            </div>
            <p className='text-xs text-muted-foreground'>
               Anyone with the link and password can view this document until
               it expires or hits the view limit.
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
               <div>
                  <Label htmlFor='share-password' className='text-xs'>
                     Password *
                  </Label>
                  <Input
                     id='share-password'
                     type='password'
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder='Min 4 characters'
                     autoComplete='new-password'
                     className={cn(
                        "mt-1",
                        passwordInvalid && "border-(--error)"
                     )}
                  />
                  {passwordInvalid && (
                     <p className='text-[11px] text-(--error) mt-1'>
                        Password must be at least {MIN_PASSWORD_LENGTH}{" "}
                        characters
                     </p>
                  )}
               </div>
               <div>
                  <Label htmlFor='share-expires' className='text-xs'>
                     Expires in *
                  </Label>
                  <select
                     id='share-expires'
                     value={expiresIn}
                     onChange={(e) => setExpiresIn(e.target.value)}
                     className='mt-1 w-full px-3 py-2 text-sm border rounded-md bg-background'
                  >
                     {EXPIRY_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                           {p.label}
                        </option>
                     ))}
                  </select>
               </div>
               <div className='sm:col-span-2'>
                  <Label htmlFor='share-max-views' className='text-xs'>
                     Max views (optional)
                  </Label>
                  <Input
                     id='share-max-views'
                     type='number'
                     min={1}
                     inputMode='numeric'
                     value={maxViews}
                     onChange={(e) => setMaxViews(e.target.value)}
                     placeholder='Unlimited'
                     className='mt-1'
                  />
                  <p className='text-[11px] text-muted-foreground mt-1'>
                     Link is auto-revoked after this many successful verifies.
                  </p>
               </div>
            </div>

            <Button
               type='submit'
               disabled={!canSubmit}
               className='w-full sm:w-auto'
            >
               {createMutation.isPending ? "Creating…" : "Create link"}
            </Button>
         </form>

         {/* Existing links */}
         <div className='space-y-3'>
            <div className='flex items-center justify-between'>
               <h3 className='text-sm font-medium'>Existing links</h3>
               {linksQuery.data && (
                  <span className='text-xs text-muted-foreground'>
                     {linksQuery.data.length} link
                     {linksQuery.data.length === 1 ? "" : "s"}
                  </span>
               )}
            </div>

            {linksQuery.isLoading && (
               <p className='text-sm text-muted-foreground'>Loading…</p>
            )}

            {linksQuery.isError && (
               <p className='text-sm text-(--error)'>
                  {linksQuery.error?.message ?? "Failed to load share links"}
               </p>
            )}

            {linksQuery.data && linksQuery.data.length === 0 && (
               <p className='text-sm text-muted-foreground'>
                  No share links yet.
               </p>
            )}

            {linksQuery.data?.map((link) => {
               const expired = link.expiresAt.getTime() < nowMs;
               const exhausted =
                  link.maxViews !== undefined &&
                  link.viewCount >= link.maxViews;
               const dead = expired || exhausted || !link.isActive;
               return (
                  <div
                     key={link.id}
                     className={cn(
                        "border rounded-lg p-3 space-y-2",
                        dead && "opacity-60"
                     )}
                  >
                     <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant={dead ? "outline" : "default"}>
                           {expired
                              ? "Expired"
                              : exhausted
                              ? "View limit reached"
                              : !link.isActive
                              ? "Revoked"
                              : "Active"}
                        </Badge>
                        <Badge variant='outline' className='gap-1'>
                           <Lock size={10} /> Password
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                           {expired ? "Expired" : "Expires"}{" "}
                           {formatRelativeTime(link.expiresAt)}
                        </span>
                        {link.maxViews !== undefined && (
                           <span className='text-xs text-muted-foreground'>
                              · {link.viewCount}/{link.maxViews} views
                           </span>
                        )}
                        {link.maxViews === undefined && (
                           <span className='text-xs text-muted-foreground'>
                              · {link.viewCount} views
                           </span>
                        )}
                     </div>
                     <div className='flex gap-2'>
                        <Input
                           value={link.url}
                           readOnly
                           className='font-mono text-xs'
                           onFocus={(e) => e.currentTarget.select()}
                        />
                        <Button
                           type='button'
                           variant='outline'
                           size='icon'
                           onClick={() => handleCopy(link)}
                           title='Copy URL'
                        >
                           {copiedId === link.id ? (
                              <Check size={16} />
                           ) : (
                              <Copy size={16} />
                           )}
                        </Button>
                        {link.isActive && (
                           <Button
                              type='button'
                              variant='destructive'
                              size='icon'
                              onClick={() => handleRevoke(link)}
                              disabled={revokeMutation.isPending}
                              title='Revoke'
                           >
                              <Trash2 size={16} />
                           </Button>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>

         <div className='text-xs text-muted-foreground flex items-center gap-1.5'>
            <ShieldOff size={12} />
            Anyone with the URL and password can view this document. Revoking
            is immediate.
         </div>
      </div>
   );
};
