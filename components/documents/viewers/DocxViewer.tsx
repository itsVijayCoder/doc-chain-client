"use client";

import { FC, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import mammoth from "mammoth";
import { fetchAuthBlob } from "@/lib/services/authFetch";
import { useScrollToHighlight } from "@/lib/hooks/useScrollToHighlight";

interface Props {
   src: string;
   documentId?: string;
}

/**
 * DOCX preview via mammoth.js — converts Word XML to plain HTML. Legacy .doc
 * (binary BIFF) is NOT supported by mammoth; callers should guard on
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 *
 * mammoth emits markup it produced itself (no scripts, no event handlers),
 * so `dangerouslySetInnerHTML` is acceptable here.
 */
const DocxViewer: FC<Props> = ({ src, documentId }) => {
   const contentRef = useRef<HTMLElement>(null);
   const query = useQuery({
      queryKey: ["viewer", "docx", src],
      queryFn: async () => {
         const blob = await fetchAuthBlob(src);
         const arrayBuffer = await blob.arrayBuffer();
         const result = await mammoth.convertToHtml({ arrayBuffer });
         return result.value || "<p><em>This document is empty.</em></p>";
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
   });

   useScrollToHighlight(contentRef, documentId, query.data !== undefined);

   if (query.isLoading) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Loading document…
         </div>
      );
   }

   if (query.isError || query.data === undefined) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            {query.error instanceof Error
               ? query.error.message
               : "Failed to load document."}
         </div>
      );
   }

   return (
      <div className='p-6 max-h-[75vh] overflow-auto'>
         <article
            ref={contentRef}
            className='text-sm leading-relaxed space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_img]:max-w-full [&_img]:h-auto'
            dangerouslySetInnerHTML={{ __html: query.data }}
         />
      </div>
   );
};

export default DocxViewer;
