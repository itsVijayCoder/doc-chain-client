"use client";

import { ReactElement, useCallback, useRef, useState } from "react";
import { Lock } from "lucide-react";
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { DcButton } from "@/components/design/primitives";

// ─────────────────────────────────────────────────────────────────────
// Tracked-download confirmation — shown before any download of a
// confidential document. The backend always watermarks; this dialog
// is a frontend-only awareness gate so the user knows the download is
// tied to their identity.
// ─────────────────────────────────────────────────────────────────────

export interface TrackedDownloadSubjectSingle {
   kind: "single";
   title: string;
}

export interface TrackedDownloadSubjectBulk {
   kind: "bulk";
   /** Total number of documents being downloaded. */
   total: number;
   /** How many of those are confidential. */
   confidential: number;
}

export type TrackedDownloadSubject =
   | TrackedDownloadSubjectSingle
   | TrackedDownloadSubjectBulk;

interface PendingState {
   subject: TrackedDownloadSubject;
   resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation dialog. Callers:
 *
 *   const { dialog, confirm } = useTrackedDownload();
 *   // ...somewhere in render
 *   {dialog}
 *   // ...before downloading
 *   if (!(await confirm({ kind: "single", title: doc.title }))) return;
 *   await documentService.downloadCurrent(...);
 *
 * Closing the dialog (overlay click / ESC / Cancel) resolves `false`.
 */
export function useTrackedDownload(): {
   dialog: ReactElement;
   confirm: (subject: TrackedDownloadSubject) => Promise<boolean>;
} {
   const [pending, setPending] = useState<PendingState | null>(null);
   // Resolver persists through the open/close cycle so ESC + overlay click
   // can resolve even after React has torn down the dialog content.
   const resolverRef = useRef<((v: boolean) => void) | null>(null);

   const confirm = useCallback(
      (subject: TrackedDownloadSubject) =>
         new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
            setPending({ subject, resolve });
         }),
      []
   );

   const close = useCallback((value: boolean) => {
      resolverRef.current?.(value);
      resolverRef.current = null;
      setPending(null);
   }, []);

   const subject = pending?.subject;

   // Derive headline + body based on single vs bulk. Copy stays calm —
   // this is awareness, not a scare dialog.
   const { heading, body, cta } = buildCopy(subject);

   const dialog = (
      <Dialog
         open={pending !== null}
         onOpenChange={(open) => {
            if (!open) close(false);
         }}
      >
         <DialogContent className='sm:max-w-[460px]'>
            <DialogHeader>
               <div className='flex items-start gap-3'>
                  <div
                     className='w-10 h-10 rounded-lg flex items-center justify-center shrink-0'
                     style={{
                        background: "var(--dc-warn-soft)",
                        color: "var(--dc-warn)",
                        border: "1px solid var(--dc-warn-border)",
                     }}
                  >
                     <Lock size={18} strokeWidth={2} />
                  </div>
                  <div className='min-w-0 flex-1'>
                     <DialogTitle>Tracked Download</DialogTitle>
                     <p
                        className='text-[12.5px] mt-1 leading-relaxed'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        {heading}
                     </p>
                  </div>
               </div>
            </DialogHeader>

            <p
               className='text-[13px] leading-relaxed'
               style={{ color: "var(--dc-text-muted)" }}
            >
               {body}
            </p>

            <DialogFooter>
               <DcButton onClick={() => close(false)}>Cancel</DcButton>
               <DcButton variant='primary' onClick={() => close(true)}>
                  {cta}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );

   return { dialog, confirm };
}

function buildCopy(subject?: TrackedDownloadSubject): {
   heading: string;
   body: string;
   cta: string;
} {
   if (!subject) {
      return { heading: "", body: "", cta: "Download" };
   }

   if (subject.kind === "single") {
      return {
         heading: `"${subject.title}" is confidential.`,
         body:
            "Your identity will be embedded in the downloaded file for " +
            "security purposes. Downloads of confidential documents are " +
            "logged and can be traced back if the file leaks.",
         cta: "Download anyway",
      };
   }

   // bulk
   const { total, confidential } = subject;
   const allConfidential = confidential === total;
   const heading = allConfidential
      ? `All ${total} selected documents are confidential.`
      : `${confidential} of ${total} selected documents ${
           confidential === 1 ? "is" : "are"
        } confidential.`;
   return {
      heading,
      body:
         "Your identity will be embedded in the downloaded files for " +
         "security purposes. Downloads of confidential documents are " +
         "logged and can be traced back if a file leaks.",
      cta: `Download ${total}`,
   };
}
