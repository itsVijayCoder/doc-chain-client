"use client";

import { FC, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
   useArchiveDocument,
   useDocument,
   useSoftDeleteDocument,
   useUnarchiveDocument,
} from "@/lib/hooks/useDocuments";
import { useTrackRecentDocument } from "@/lib/hooks/useRecentDocuments";
import {
   useCachedVerification,
   useVerifyDocument,
} from "@/lib/hooks/useBlockchain";
import { documentService } from "@/lib/services/documentService";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Archive,
   ArchiveRestore,
   ArrowLeft,
   CheckCircle2,
   Download,
   Settings,
   Share2,
   Trash2,
   Shield,
   ShieldAlert,
   Lock,
   File,
   Clock,
   User,
   Tag,
   MessageSquare,
   History,
   XCircle,
} from "lucide-react";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
   ConfidentialIndicator,
   DcButton,
   VerifiedBadge,
} from "@/components/design/primitives";
import { useTrackedDownload } from "@/components/documents/TrackedDownloadDialog";
import { DocumentSettingsDialog } from "@/components/documents/DocumentSettingsDialog";
import dynamic from "next/dynamic";
import { ShareLinksPanel } from "@/components/documents/sharing/ShareLinksPanel";
import { PermissionsPanel } from "@/components/documents/sharing/PermissionsPanel";
import { DocumentViewer } from "@/components/documents/DocumentViewer";

const CommentsPanel = dynamic(
   () => import("@/components/documents/CommentsPanel"),
   {
      ssr: false,
      loading: () => (
         <div className='p-8 text-center text-sm text-muted-foreground'>
            Loading comments…
         </div>
      ),
   }
);

const DocumentContentViewer = dynamic(
   () => import("@/components/documents/viewers/DocumentContentViewer"),
   {
      ssr: false,
      loading: () => (
         <div className='p-12 text-center text-sm text-muted-foreground'>
            Loading content…
         </div>
      ),
   }
);
import type { ApiError } from "@/lib/types";

const DocumentDetailPage: FC = () => {
   const router = useRouter();
   const params = useParams();
   const searchParams = useSearchParams();
   const toast = useToast();
   const documentId = params.id as string;
   // Old links used `?tab=details`; coerce them to the new Preview tab so
   // bookmarks don't break.
   const rawTab = searchParams.get("tab") || "preview";
   const activeTab = rawTab === "details" ? "preview" : rawTab;

   // Real data — document + versions via TanStack.
   const docQuery = useDocument(documentId);
   const doc = docQuery.data?.document;
   const versions = docQuery.data?.versions ?? [];

   // Push this doc onto the "recently opened" list in localStorage once the
   // title is known — feeds the command bar's Recent section. Dedup by id
   // is handled inside the hook.
   const trackRecent = useTrackRecentDocument();
   useEffect(() => {
      if (!doc) return;
      trackRecent({ id: doc.id, title: doc.title, mimeType: doc.mimeType });
   }, [doc, trackRecent]);

   const [isDownloading, setIsDownloading] = useState(false);
   const [settingsOpen, setSettingsOpen] = useState(false);
   const deleteMutation = useSoftDeleteDocument();
   const archiveMutation = useArchiveDocument();
   const unarchiveMutation = useUnarchiveDocument();
   const verifyMutation = useVerifyDocument();
   const cachedVerify = useCachedVerification(documentId);
   // Frontend-only awareness gate for confidential downloads. Backend
   // always watermarks; this dialog tells the user before the file hits
   // their disk. `confirm()` resolves false on cancel/ESC/overlay click.
   const { dialog: trackedDialog, confirm: confirmTrackedDownload } =
      useTrackedDownload();

   const handleDownload = async () => {
      if (!doc) return;
      if (doc.isConfidential) {
         const ok = await confirmTrackedDownload({
            kind: "single",
            title: doc.title,
         });
         if (!ok) return;
      }
      setIsDownloading(true);
      try {
         await documentService.downloadCurrent(doc.id, doc.title);
         toast.success("Download started");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Download failed",
            apiErr?.message ?? "Could not fetch the file"
         );
      } finally {
         setIsDownloading(false);
      }
   };

   const handleDownloadVersion = async (versionNumber: number) => {
      if (!doc) return;
      if (doc.isConfidential) {
         const ok = await confirmTrackedDownload({
            kind: "single",
            title: `${doc.title} (v${versionNumber})`,
         });
         if (!ok) return;
      }
      try {
         await documentService.downloadVersion(doc.id, versionNumber, doc.title);
         toast.success(`Version ${versionNumber} downloaded`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Download failed",
            apiErr?.message ?? "Could not fetch this version"
         );
      }
   };

   const handleShare = () => {
      router.push(`/documents/${documentId}?tab=share`);
   };

   const handleDelete = async () => {
      if (!doc) return;
      if (!window.confirm(`Move "${doc.title}" to trash?`)) return;
      try {
         await deleteMutation.mutateAsync(doc.id);
         toast.success("Moved to trash");
         router.push("/documents");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Delete failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleVerify = async () => {
      if (!doc) return;
      try {
         const result = await verifyMutation.mutateAsync(doc.id);
         if (result.verified) {
            toast.success(
               "Verified on blockchain",
               result.message || "File hash matches the on-chain record"
            );
         } else {
            toast.error(
               "Verification failed",
               result.message || "On-chain hash does not match the file"
            );
         }
      } catch (err) {
         const apiErr = err as ApiError;
         if (apiErr?.code === "BLOCKCHAIN_RECORD_NOT_FOUND") {
            toast.error(
               "Not anchored yet",
               "This document has no blockchain record yet. Pending submissions take a few minutes to confirm."
            );
            return;
         }
         toast.error(
            "Verification failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleArchiveToggle = async () => {
      if (!doc) return;
      const mutation = doc.isArchived ? unarchiveMutation : archiveMutation;
      const verb = doc.isArchived ? "Unarchived" : "Archived";
      try {
         await mutation.mutateAsync(doc.id);
         toast.success(verb, `"${doc.title}"`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            `${doc.isArchived ? "Unarchive" : "Archive"} failed`,
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const archivePending =
      archiveMutation.isPending || unarchiveMutation.isPending;

   if (docQuery.isLoading) {
      return (
         <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
               <div
                  className='inline-block w-8 h-8 rounded-full border-b-2 animate-spin'
                  style={{ borderColor: "var(--dc-accent)" }}
               />
               <p
                  className='text-[13px] mt-3'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading document…
               </p>
            </div>
         </div>
      );
   }

   if (docQuery.isError || !doc) {
      const apiErr = docQuery.error as ApiError | null;
      return (
         <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
               <p
                  className='text-[15px] font-semibold'
                  style={{ color: "var(--dc-text)" }}
               >
                  {apiErr?.statusCode === 404
                     ? "Document not found"
                     : "Failed to load document"}
               </p>
               {apiErr?.message && apiErr.statusCode !== 404 && (
                  <p
                     className='text-[13px] mt-1'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     {apiErr.message}
                  </p>
               )}
               <DcButton
                  onClick={() => router.push("/documents")}
                  className='mt-4'
               >
                  Back to Documents
               </DcButton>
            </div>
         </div>
      );
   }

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] space-y-5'>
         {/* Back nav + action row */}
         <div className='flex items-center justify-between gap-4 flex-wrap'>
            <button
               type='button'
               onClick={() => router.push("/documents")}
               className='inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] transition-colors'
               style={{ color: "var(--dc-text-muted)" }}
               onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--dc-surface-2)";
                  e.currentTarget.style.color = "var(--dc-text)";
               }}
               onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--dc-text-muted)";
               }}
            >
               <ArrowLeft size={14} strokeWidth={1.75} />
               Back to Documents
            </button>

            <div className='flex items-center gap-1.5 flex-wrap'>
               <DcButton
                  icon={<Download size={14} strokeWidth={1.75} />}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  title={
                     doc.isConfidential
                        ? "Confidential — this download is tracked"
                        : undefined
                  }
               >
                  {isDownloading ? "Downloading…" : "Download"}
               </DcButton>
               <DcButton
                  icon={<Share2 size={14} strokeWidth={1.75} />}
                  onClick={handleShare}
               >
                  Share
               </DcButton>
               <DcButton
                  icon={
                     doc.isArchived ? (
                        <ArchiveRestore size={14} strokeWidth={1.75} />
                     ) : (
                        <Archive size={14} strokeWidth={1.75} />
                     )
                  }
                  onClick={handleArchiveToggle}
                  disabled={archivePending}
                  title={doc.isArchived ? "Restore to main list" : "Hide from main list"}
               >
                  {doc.isArchived ? "Unarchive" : "Archive"}
               </DcButton>
               <DcButton
                  icon={<Shield size={14} strokeWidth={1.75} />}
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  title='Check that this file matches its blockchain-anchored hash'
               >
                  {verifyMutation.isPending ? "Verifying…" : "Verify"}
               </DcButton>
               <DcButton
                  icon={<Settings size={14} strokeWidth={1.75} />}
                  onClick={() => setSettingsOpen(true)}
                  title='Edit title, description, and confidentiality'
               >
                  Settings
               </DcButton>
               <DcButton
                  variant='danger'
                  icon={<Trash2 size={14} strokeWidth={1.75} />}
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
               >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
               </DcButton>
            </div>
         </div>

         {/* Title + description */}
         <div>
            <h1
               className='text-[28px] font-semibold tracking-[-0.02em] m-0 flex items-center gap-2.5'
               style={{
                  color: "var(--dc-text)",
                  fontFamily: "var(--dc-font-display)",
               }}
            >
               {doc.isConfidential && (
                  <Lock
                     size={20}
                     strokeWidth={2}
                     aria-label='Confidential'
                     style={{ color: "var(--dc-warn)", flexShrink: 0 }}
                  />
               )}
               <span>{doc.title}</span>
            </h1>
            {doc.description && (
               <p
                  className='text-[14px] mt-1.5 leading-relaxed'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {doc.description}
               </p>
            )}
         </div>

         {/* Confidential banner — only for confidential docs. Sits above
             the metadata strip so the posture is the first thing the user
             registers after the title. */}
         {doc.isConfidential && <ConfidentialIndicator variant='banner' />}

         {/* Inline metadata strip — owner, size, modified, created, tags */}
         <div
            className='flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]'
            style={{ color: "var(--dc-text-dim)" }}
         >
            <MetaItem icon={<User size={12} strokeWidth={1.75} />}>
               <span style={{ color: "var(--dc-text)" }}>
                  {doc.owner?.name ?? "Unknown"}
               </span>
            </MetaItem>
            <DotSepInline />
            <MetaItem icon={<File size={12} strokeWidth={1.75} />}>
               {formatBytes(doc.fileSize ?? 0)}
            </MetaItem>
            <DotSepInline />
            <MetaItem icon={<Clock size={12} strokeWidth={1.75} />}>
               Modified {formatRelativeTime(doc.updatedAt)}
            </MetaItem>
            <DotSepInline />
            <MetaItem icon={<Clock size={12} strokeWidth={1.75} />}>
               Created {formatRelativeTime(doc.createdAt)}
            </MetaItem>
            {doc.tags.length > 0 && (
               <>
                  <DotSepInline />
                  <MetaItem icon={<Tag size={12} strokeWidth={1.75} />}>
                     <span className='flex flex-wrap gap-1'>
                        {doc.tags.map((tag) => (
                           <TagChip key={tag}>{tag}</TagChip>
                        ))}
                     </span>
                  </MetaItem>
               </>
            )}
         </div>

         {/* Status chips — mimeType + verified state + share count + hash */}
         <div className='flex items-center gap-2 flex-wrap'>
            <Chip>{doc.mimeType}</Chip>
            {doc.isArchived && (
               <Chip
                  style={{
                     background: "var(--dc-warn-soft)",
                     color: "var(--dc-warn)",
                     border: "1px solid var(--dc-warn-border)",
                  }}
               >
                  <Archive size={11} strokeWidth={2} /> Archived
               </Chip>
            )}
            {cachedVerify?.verified && <VerifiedBadge status='verified' />}
            {cachedVerify && !cachedVerify.verified && (
               <Chip
                  style={{
                     background: "var(--dc-danger-soft)",
                     color: "var(--dc-danger)",
                     border: "1px solid var(--dc-danger-border)",
                  }}
               >
                  <XCircle size={11} strokeWidth={2} /> Hash mismatch
               </Chip>
            )}
            {doc.isEncrypted && (
               <Chip>
                  <Lock size={11} strokeWidth={2} /> Encrypted
               </Chip>
            )}
            <Chip>
               <Share2 size={11} strokeWidth={2} />
               {doc.shareCount ?? 0}{" "}
               Share{(doc.shareCount ?? 0) !== 1 ? "s" : ""}
            </Chip>
            {doc.blockchainHash && (
               <Chip
                  style={{
                     fontFamily: "var(--dc-font-mono)",
                  }}
                  title={doc.blockchainHash}
               >
                  {doc.blockchainHash.slice(0, 12)}…
               </Chip>
            )}
         </div>

         {/* Blockchain verification result card — visible after a verify run */}
         {cachedVerify && (
            <div
               className='rounded-xl p-4 text-[13px]'
               style={{
                  background: cachedVerify.verified
                     ? "var(--dc-accent-soft)"
                     : "var(--dc-danger-soft)",
                  border: `1px solid ${
                     cachedVerify.verified
                        ? "var(--dc-accent-border)"
                        : "var(--dc-danger-border)"
                  }`,
               }}
            >
               <div className='flex items-start gap-3'>
                  {cachedVerify.verified ? (
                     <Shield
                        size={18}
                        strokeWidth={1.75}
                        className='mt-0.5 shrink-0'
                        style={{ color: "var(--dc-accent)" }}
                     />
                  ) : (
                     <ShieldAlert
                        size={18}
                        strokeWidth={1.75}
                        className='mt-0.5 shrink-0'
                        style={{ color: "var(--dc-danger)" }}
                     />
                  )}
                  <div className='flex-1 min-w-0 space-y-2'>
                     <div>
                        <p
                           className='font-semibold'
                           style={{ color: "var(--dc-text)" }}
                        >
                           {cachedVerify.verified
                              ? "File matches the on-chain record"
                              : "File does not match the on-chain record"}
                        </p>
                        {cachedVerify.message && (
                           <p
                              className='text-[12px] mt-1'
                              style={{ color: "var(--dc-text-muted)" }}
                           >
                              {cachedVerify.message}
                           </p>
                        )}
                     </div>
                     <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]'>
                        <VerifyField label='File hash' mono value={cachedVerify.fileHash} />
                        <VerifyField label='Chain hash' mono value={cachedVerify.chainHash} />
                        {cachedVerify.txId && (
                           <VerifyField
                              label='Transaction'
                              mono
                              value={cachedVerify.txId}
                           />
                        )}
                        {cachedVerify.blockNumber !== undefined && (
                           <VerifyField
                              label='Block'
                              mono
                              value={`#${cachedVerify.blockNumber}`}
                           />
                        )}
                        {cachedVerify.confirmedAt && (
                           <VerifyField
                              label='Confirmed'
                              value={formatRelativeTime(cachedVerify.confirmedAt)}
                           />
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Tabs */}
         <Tabs
            value={activeTab}
            onValueChange={(v) =>
               router.push(`/documents/${documentId}?tab=${v}`)
            }
         >
            <TabsList>
               <TabsTrigger value='preview'>Preview</TabsTrigger>
               <TabsTrigger value='content'>Content</TabsTrigger>
               <TabsTrigger value='versions'>
                  Versions ({versions.length})
               </TabsTrigger>
               <TabsTrigger value='comments'>
                  Comments
               </TabsTrigger>
               <TabsTrigger value='share'>Sharing</TabsTrigger>
            </TabsList>

            {/* Preview Tab — in-browser viewer for supported MIME types */}
            <TabsContent value='preview' className='space-y-4 pt-4'>
               <DocumentViewer document={doc} onDownload={handleDownload} />
            </TabsContent>

            {/* Content Tab — pre-computed server-side text. Zero cost per
                request. Chat source clicks highlight inside the text here
                because only the mounted viewer picks up highlightStore events. */}
            <TabsContent value='content' className='space-y-4 pt-4'>
               <div
                  className='rounded-xl overflow-hidden'
                  style={{
                     background: "var(--dc-surface)",
                     border: "1px solid var(--dc-border)",
                  }}
               >
                  <DocumentContentViewer documentId={doc.id} />
               </div>
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value='versions' className='pt-4'>
               <div className='space-y-3'>
                  <h3
                     className='text-[15px] font-semibold'
                     style={{ color: "var(--dc-text)" }}
                  >
                     Version History
                  </h3>
                  {versions.length === 0 ? (
                     <p
                        className='text-[13px]'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        No version history available
                     </p>
                  ) : (
                     <div className='space-y-2'>
                        {versions.map((version) => (
                           <div
                              key={version.id}
                              className='rounded-xl p-4 transition-colors'
                              style={{
                                 background: "var(--dc-surface)",
                                 border: "1px solid var(--dc-border)",
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.borderColor =
                                    "var(--dc-border-bright)";
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.borderColor =
                                    "var(--dc-border)";
                              }}
                           >
                              <div className='flex items-center justify-between gap-3'>
                                 <div className='flex items-center gap-3 min-w-0'>
                                    <div
                                       className='w-8 h-8 rounded-md flex items-center justify-center shrink-0'
                                       style={{
                                          background: "var(--dc-surface-2)",
                                          border: "1px solid var(--dc-border)",
                                          color: "var(--dc-text-muted)",
                                       }}
                                    >
                                       <History
                                          size={14}
                                          strokeWidth={1.75}
                                       />
                                    </div>
                                    <div className='min-w-0'>
                                       <p
                                          className='text-[13px] font-semibold flex items-center gap-2'
                                          style={{ color: "var(--dc-text)" }}
                                       >
                                          Version {version.version}
                                          {version.version === doc.version && (
                                             <span
                                                className='inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-medium uppercase tracking-[0.04em]'
                                                style={{
                                                   background:
                                                      "var(--dc-accent-soft)",
                                                   color: "var(--dc-accent)",
                                                   border:
                                                      "1px solid var(--dc-accent-border)",
                                                }}
                                             >
                                                Current
                                             </span>
                                          )}
                                       </p>
                                       <p
                                          className='text-[11.5px] mt-0.5'
                                          style={{ color: "var(--dc-text-dim)" }}
                                       >
                                          {formatRelativeTime(version.createdAt)}
                                       </p>
                                       {version.fileHash && (
                                          <p
                                             className='text-[11px] truncate'
                                             style={{
                                                fontFamily:
                                                   "var(--dc-font-mono)",
                                                color: "var(--dc-text-faint)",
                                             }}
                                          >
                                             {version.fileHash}
                                          </p>
                                       )}
                                    </div>
                                 </div>
                                 <div className='flex items-center gap-2 shrink-0'>
                                    <span
                                       className='text-[11px] tabular-nums'
                                       style={{
                                          color: "var(--dc-text-muted)",
                                       }}
                                    >
                                       {formatBytes(version.fileSize)}
                                    </span>
                                    <DcButton
                                       size='sm'
                                       icon={
                                          <Download
                                             size={13}
                                             strokeWidth={1.75}
                                          />
                                       }
                                       onClick={() =>
                                          handleDownloadVersion(version.version)
                                       }
                                    >
                                       Download
                                    </DcButton>
                                 </div>
                              </div>
                              {version.changes && (
                                 <p
                                    className='text-[12px] mt-2 pl-11'
                                    style={{ color: "var(--dc-text-muted)" }}
                                 >
                                    {version.changes}
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value='comments' className='pt-4'>
               <CommentsPanel documentId={documentId} />
            </TabsContent>

            {/* Share Tab — direct user/group grants + password-gated links */}
            <TabsContent value='share' className='space-y-6 pt-4'>
               <PermissionsPanel documentId={doc.id} />
               <div className='border-t pt-6'>
                  <h3 className='text-sm font-medium mb-4'>
                     Share via password-protected link
                  </h3>
                  <ShareLinksPanel
                     documentId={doc.id}
                     documentTitle={doc.title}
                  />
               </div>
            </TabsContent>
         </Tabs>

         {/* Tracked-download confirmation — rendered always, opens only
             when handleDownload/handleDownloadVersion requests it. */}
         {trackedDialog}

         {/* Document settings (title / description / confidential) */}
         <DocumentSettingsDialog
            document={doc}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
         />
      </div>
   );
};

export default DocumentDetailPage;

// ─────────────────────────────────────────────────────────────────────
// Inline meta/chip helpers — scoped to this page
// ─────────────────────────────────────────────────────────────────────
const MetaItem: FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
   icon,
   children,
}) => (
   <span className='flex items-center gap-1.5'>
      {icon}
      {children}
   </span>
);

const DotSepInline: FC = () => (
   <span
      aria-hidden
      className='inline-block w-[3px] h-[3px] rounded-full'
      style={{ background: "var(--dc-text-faint)" }}
   />
);

const Chip: FC<{
   children: React.ReactNode;
   style?: React.CSSProperties;
   title?: string;
}> = ({ children, style, title }) => (
   <span
      title={title}
      className='inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium truncate max-w-[14rem]'
      style={{
         background: "var(--dc-surface-2)",
         color: "var(--dc-text-muted)",
         border: "1px solid var(--dc-border)",
         ...style,
      }}
   >
      {children}
   </span>
);

const VerifyField: FC<{ label: string; value: string; mono?: boolean }> = ({
   label,
   value,
   mono,
}) => (
   <div>
      <span style={{ color: "var(--dc-text-dim)" }}>{label}</span>
      <p
         className='break-all mt-0.5'
         style={{
            color: "var(--dc-text)",
            fontFamily: mono ? "var(--dc-font-mono)" : undefined,
            fontSize: mono ? 11 : 12,
         }}
         title={value}
      >
         {value}
      </p>
   </div>
);

const TagChip: FC<{ children: React.ReactNode }> = ({ children }) => (
   <span
      className='text-[10.5px] px-1.5 py-[1px] rounded font-medium'
      style={{
         background: "var(--dc-surface-2)",
         color: "var(--dc-text-muted)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {children}
   </span>
);
