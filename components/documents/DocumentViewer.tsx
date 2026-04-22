"use client";

import { FC } from "react";
import dynamic from "next/dynamic";
import { Download, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthenticatedImage } from "@/components/shared/AuthenticatedImage";
import { AuthenticatedVideo } from "@/components/shared/AuthenticatedVideo";
import { AuthenticatedText } from "@/components/shared/AuthenticatedText";
import type { Document } from "@/lib/types";

// Heavy viewers are lazy-loaded. Each library (react-pdf, react-markdown,
// mammoth, xlsx) only ships when the user actually opens a file of that
// type. `ssr: false` because all of them rely on browser APIs.
const LoadingBlock = () => (
   <div className='p-12 text-center text-sm text-muted-foreground'>
      Loading viewer…
   </div>
);

const PdfJsViewer = dynamic(
   () => import("./viewers/PdfJsViewer"),
   { ssr: false, loading: LoadingBlock }
);

const MarkdownViewer = dynamic(
   () => import("./viewers/MarkdownViewer"),
   { ssr: false, loading: LoadingBlock }
);

const DocxViewer = dynamic(
   () => import("./viewers/DocxViewer"),
   { ssr: false, loading: LoadingBlock }
);

const SpreadsheetViewer = dynamic(
   () => import("./viewers/SpreadsheetViewer"),
   { ssr: false, loading: LoadingBlock }
);

interface DocumentViewerProps {
   document: Document;
   onDownload?: () => void;
}

// MIME constants — extracted so the dispatch below reads as prose.
const DOCX_MIME =
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS_MIME = "application/vnd.ms-excel";
const CSV_MIME = "text/csv";

function isSpreadsheet(mime: string) {
   return (
      mime === XLSX_MIME ||
      mime === XLS_MIME ||
      mime === CSV_MIME ||
      // Some browsers send text/csv as application/csv or x-csv.
      mime === "application/csv" ||
      mime === "application/x-csv"
   );
}

/**
 * Renders a document preview dispatched by MIME type. Supported today:
 *   - image/*                            — AuthenticatedImage
 *   - application/pdf                    — PdfJsViewer (react-pdf)
 *   - text/markdown                      — MarkdownViewer (react-markdown)
 *   - text/plain                         — AuthenticatedText (<pre>)
 *   - text/csv, XLSX, XLS                — SpreadsheetViewer (SheetJS)
 *   - DOCX                               — DocxViewer (mammoth.js)
 *   - video/*                            — AuthenticatedVideo
 * Anything else shows an explanatory card with a Download CTA.
 */
export const DocumentViewer: FC<DocumentViewerProps> = ({
   document,
   onDownload,
}) => {
   const mime = document.mimeType;
   const fileSrc = `/documents/${document.id}/download`;

   if (mime.startsWith("image/")) {
      return (
         <div className='border rounded-lg bg-muted/30 p-4 flex items-center justify-center min-h-[60vh]'>
            <AuthenticatedImage
               src={fileSrc}
               alt={document.title}
               className='max-w-full max-h-[70vh] object-contain rounded'
               fallback={
                  <div className='text-sm text-muted-foreground py-12'>
                     Loading image…
                  </div>
               }
            />
         </div>
      );
   }

   if (mime === "application/pdf") {
      return (
         <div className='border rounded-lg overflow-hidden bg-background'>
            <PdfJsViewer
               src={fileSrc}
               title={document.title}
               documentId={document.id}
            />
         </div>
      );
   }

   if (mime === "text/markdown") {
      return (
         <div className='border rounded-lg bg-background overflow-hidden'>
            <MarkdownViewer src={fileSrc} documentId={document.id} />
         </div>
      );
   }

   if (mime === "text/plain") {
      return (
         <div className='border rounded-lg bg-muted/30 overflow-hidden'>
            <AuthenticatedText
               src={fileSrc}
               documentId={document.id}
               fallback={
                  <div className='text-sm text-muted-foreground p-12 text-center'>
                     Loading preview…
                  </div>
               }
            />
         </div>
      );
   }

   if (isSpreadsheet(mime)) {
      return (
         <div className='border rounded-lg bg-background overflow-hidden'>
            <SpreadsheetViewer src={fileSrc} />
         </div>
      );
   }

   if (mime === DOCX_MIME) {
      return (
         <div className='border rounded-lg bg-background overflow-hidden'>
            <DocxViewer src={fileSrc} documentId={document.id} />
         </div>
      );
   }

   if (mime.startsWith("video/")) {
      return (
         <div className='border rounded-lg bg-muted/30 p-4 flex items-center justify-center min-h-[50vh]'>
            <AuthenticatedVideo
               src={fileSrc}
               mimeType={mime}
               className='max-w-full max-h-[70vh] rounded'
               fallback={
                  <div className='text-sm text-muted-foreground py-12'>
                     Loading video…
                  </div>
               }
            />
         </div>
      );
   }

   return (
      <div className='border rounded-lg bg-muted/30 p-12 text-center space-y-4'>
         <FileWarning
            size={48}
            className='mx-auto text-muted-foreground'
            aria-hidden='true'
         />
         <div>
            <p className='font-medium'>Preview not available</p>
            <p className='text-sm text-muted-foreground mt-1'>
               In-browser preview for <code>{mime}</code> isn&apos;t supported
               yet. Download the file to view it in its native application.
            </p>
         </div>
         {onDownload && (
            <Button variant='outline' onClick={onDownload}>
               <Download size={16} className='mr-2' />
               Download
            </Button>
         )}
      </div>
   );
};
