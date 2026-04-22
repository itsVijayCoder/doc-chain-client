"use client";

import { FC, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { documentService } from "@/lib/services/documentService";
import { useScrollToHighlight } from "@/lib/hooks/useScrollToHighlight";
import { ScanText, FileText, FileX, Ban, TriangleAlert } from "lucide-react";

// Returns true when the sample text is mostly non-printable — i.e. CMap garbage
// stored before the backend isReadableText quality gate was deployed.
function isGarbled(text: string): boolean {
   if (!text) return false;
   const sample = text.slice(0, 500);
   let printable = 0;
   for (const c of sample) {
      const code = c.charCodeAt(0);
      if ((code >= 0x20 && code < 0x7f) || code === 0x0a || code === 0x0d || code === 0x09) {
         printable++;
      }
   }
   return printable / sample.length < 0.6;
}

interface Props {
   documentId: string;
}

// Per-source metadata shown above the content.
const SOURCE_META = {
   native: {
      label: "Digital text",
      icon: FileText,
      description: "Text extracted directly from the document.",
   },
   ocr: {
      label: "OCR",
      icon: ScanText,
      description: "Text recognised via Google Vision (scanned document).",
   },
   none: {
      label: "No text",
      icon: FileX,
      description: null,
   },
   not_searchable: {
      label: "Not extractable",
      icon: Ban,
      description: null,
   },
} as const;

type KnownSource = keyof typeof SOURCE_META;

const DocumentContentViewer: FC<Props> = ({ documentId }) => {
   const contentRef = useRef<HTMLDivElement>(null);

   const query = useQuery({
      queryKey: ["document-content", documentId],
      queryFn: () => documentService.getContent(documentId),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
   });

   useScrollToHighlight(contentRef, documentId, query.data !== undefined);

   if (query.isLoading) {
      return (
         <div className="p-12 text-center text-sm text-muted-foreground">
            Loading content…
         </div>
      );
   }

   if (query.isError || !query.data) {
      return (
         <div className="p-12 text-center text-sm text-muted-foreground">
            Could not load document content.
         </div>
      );
   }

   const { source, pages, wordCount } = query.data;
   const meta = SOURCE_META[source as KnownSource] ?? SOURCE_META.none;
   const Icon = meta.icon;

   // "none" and "not_searchable" — no text to show.
   if (source === "none" || source === "not_searchable") {
      return (
         <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <div className="flex justify-center">
               <Icon size={28} className="opacity-50" />
            </div>
            <p className="font-medium">
               {source === "not_searchable"
                  ? "This file type doesn't support text extraction"
                  : "No text content available"}
            </p>
            <p className="text-xs">
               {source === "not_searchable"
                  ? "Videos, images without OCR, and binary files cannot be read as text."
                  : "This may be a video, binary file, or an image without OCR enabled."}
            </p>
         </div>
      );
   }

   const hasContent = pages.some((p) => p.content.trim().length > 0);

   if (!hasContent) {
      return (
         <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <div className="flex justify-center">
               <FileX size={28} className="opacity-50" />
            </div>
            <p className="font-medium">No extractable text</p>
            <p className="text-xs">
               This document appears to have no text layer.
            </p>
         </div>
      );
   }

   // Detect CMap garbage from documents indexed before the quality-gate fix.
   const sampleText = pages.slice(0, 3).map((p) => p.content).join(" ");
   const garbled = isGarbled(sampleText);

   return (
      <div className="flex flex-col">
         {/* Re-index warning for pre-fix garbage embeddings */}
         {garbled && (
            <div className="flex items-start gap-3 px-4 py-3 border-b bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
               <TriangleAlert size={15} className="mt-0.5 shrink-0" />
               <p>
                  This document was indexed before a text-extraction fix and its
                  content may be unreadable. Re-upload the file to fix AI chat
                  and search.
               </p>
            </div>
         )}

         {/* Toolbar */}
         <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-muted/40 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
               <Icon size={13} />
               <span>{meta.description ?? meta.label}</span>
            </div>
            <div className="flex items-center gap-2">
               {source === "ocr" && (
                  <Badge variant="outline" className="text-[10px] py-0">
                     OCR
                  </Badge>
               )}
               <Badge variant="secondary" className="text-[10px] py-0 tabular-nums">
                  {wordCount.toLocaleString()} words
               </Badge>
            </div>
         </div>

         {/* Content */}
         <div
            ref={contentRef}
            className="max-h-[75vh] overflow-auto px-6 py-4 divide-y"
         >
            {pages.length === 1 ? (
               <p className="text-sm leading-relaxed whitespace-pre-wrap break-words py-2">
                  {pages[0].content}
               </p>
            ) : (
               pages.map((p) => (
                  <section
                     key={p.page}
                     className="py-4 first:pt-2 last:pb-2 space-y-2"
                     data-page={p.page}
                  >
                     <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                           Page {p.page}
                        </h3>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                           {p.content.length.toLocaleString()} chars
                        </span>
                     </div>
                     {p.content.trim().length > 0 ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                           {p.content}
                        </p>
                     ) : (
                        <p className="text-xs italic text-muted-foreground">
                           (no extractable text on this page)
                        </p>
                     )}
                  </section>
               ))
            )}
         </div>
      </div>
   );
};

export default DocumentContentViewer;
