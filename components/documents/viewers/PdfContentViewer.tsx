"use client";

import { FC, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { pdfjs } from "react-pdf";
import { fetchAuthBlob } from "@/lib/services/authFetch";
import { useScrollToHighlight } from "@/lib/hooks/useScrollToHighlight";

interface Props {
   src: string;
   documentId?: string;
}

interface PageText {
   page: number;
   text: string;
}

/**
 * Extract raw text from a PDF, page by page. pdf.js gives us text items
 * with absolute position info, but we only need the text — just concat.
 * Runs on the main thread after the worker parses; for very large PDFs
 * this can take a second or two, which is why we cache it in TanStack.
 */
async function extractPdfText(blob: Blob): Promise<PageText[]> {
   const arrayBuffer = await blob.arrayBuffer();
   const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
      .promise;
   const pages: PageText[] = [];
   for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
         .map((item) => ("str" in item ? (item as { str: string }).str : ""))
         .join(" ")
         // pdf.js inserts extra spaces between text items — collapse them
         // so the Content tab reads cleanly.
         .replace(/\s+/g, " ")
         .trim();
      pages.push({ page: i, text });
   }
   return pages;
}

const PdfContentViewer: FC<Props> = ({ src, documentId }) => {
   const contentRef = useRef<HTMLDivElement>(null);

   const query = useQuery({
      queryKey: ["viewer", "pdf-text", src],
      queryFn: async () => {
         const blob = await fetchAuthBlob(src);
         return extractPdfText(blob);
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
   });

   // Shared hook with the other text-based viewers — receives highlight
   // requests from the chat store and scrolls to + wraps the match in
   // a temporary <mark>. Uses the DOM of the container ref below.
   useScrollToHighlight(contentRef, documentId, query.data !== undefined);

   if (query.isLoading) {
      return (
         <div className='p-12 text-center text-sm text-muted-foreground'>
            Extracting text from PDF…
         </div>
      );
   }

   if (query.isError || !query.data) {
      return (
         <div className='p-12 text-center text-sm text-muted-foreground'>
            Could not extract text from this PDF. The file may be scanned or
            image-only — try the Preview tab for the visual view.
         </div>
      );
   }

   const pages = query.data;
   const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0);

   if (totalChars === 0) {
      return (
         <div className='p-12 text-center text-sm text-muted-foreground space-y-2'>
            <p className='font-medium'>No extractable text</p>
            <p>
               This PDF has no text layer — it&apos;s likely scanned or image-based.
               Use the Preview tab to view the page images.
            </p>
         </div>
      );
   }

   return (
      <div
         ref={contentRef}
         className='max-h-[75vh] overflow-auto px-6 py-4 divide-y'
      >
         {pages.map((p) => (
            <section
               key={p.page}
               className='py-4 first:pt-2 last:pb-2 space-y-2'
               data-page={p.page}
            >
               <div className='flex items-center justify-between'>
                  <h3 className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                     Page {p.page}
                  </h3>
                  <span className='text-[10px] text-muted-foreground tabular-nums'>
                     {p.text.length.toLocaleString()} chars
                  </span>
               </div>
               {p.text.length > 0 ? (
                  <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
                     {p.text}
                  </p>
               ) : (
                  <p className='text-xs italic text-muted-foreground'>
                     (no extractable text on this page)
                  </p>
               )}
            </section>
         ))}
      </div>
   );
};

export default PdfContentViewer;
