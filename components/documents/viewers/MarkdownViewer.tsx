"use client";

import { FC, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchAuthBlob } from "@/lib/services/authFetch";
import { useScrollToHighlight } from "@/lib/hooks/useScrollToHighlight";

interface Props {
   src: string;
   documentId?: string;
}

const MarkdownViewer: FC<Props> = ({ src, documentId }) => {
   const contentRef = useRef<HTMLElement>(null);
   const query = useQuery({
      queryKey: ["viewer", "markdown", src],
      queryFn: async () => {
         const blob = await fetchAuthBlob(src);
         return blob.text();
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
   });

   useScrollToHighlight(contentRef, documentId, query.data !== undefined);

   if (query.isLoading) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Loading preview…
         </div>
      );
   }

   if (query.isError || query.data === undefined) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Failed to load file.
         </div>
      );
   }

   return (
      <div className='p-6 max-h-[75vh] overflow-auto'>
         {/* Minimal prose styling. Swap for `prose dark:prose-invert` if the
             project later adds @tailwindcss/typography. */}
         <article
            ref={contentRef}
            className='text-sm leading-relaxed space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_table]:border-collapse [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1'
         >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
               {query.data}
            </ReactMarkdown>
         </article>
      </div>
   );
};

export default MarkdownViewer;
