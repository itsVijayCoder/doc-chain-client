"use client";

import { FC, useEffect, useRef, useState } from "react";
import api from "@/lib/services/api";
import { useScrollToHighlight } from "@/lib/hooks/useScrollToHighlight";

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024; // 2 MB

interface Props {
   src: string;
   className?: string;
   fallback?: React.ReactNode;
   documentId?: string;
}

type LoadState =
   | { kind: "loading" }
   | { kind: "error" }
   | { kind: "too-large"; size: number }
   | { kind: "ready"; text: string };

/**
 * Renders a text file fetched from an authenticated backend endpoint.
 * Caps at 2 MB — large text files (logs, data dumps) would freeze the DOM
 * if rendered inline. Callers should offer a Download CTA alongside when
 * rendering potentially-large documents.
 */
export const AuthenticatedText: FC<Props> = ({
   src,
   className,
   fallback = null,
   documentId,
}) => {
   const [state, setState] = useState<LoadState>({ kind: "loading" });
   const preRef = useRef<HTMLPreElement>(null);
   useScrollToHighlight(preRef, documentId, state.kind === "ready");

   useEffect(() => {
      let aborted = false;
      const relative = src.replace(/^\/api\/v1/, "");

      api.get<Blob>(relative, { responseType: "blob" })
         .then(async (res) => {
            if (aborted) return;
            if (res.data.size > MAX_PREVIEW_BYTES) {
               setState({ kind: "too-large", size: res.data.size });
               return;
            }
            const text = await res.data.text();
            if (!aborted) setState({ kind: "ready", text });
         })
         .catch(() => {
            if (!aborted) setState({ kind: "error" });
         });

      return () => {
         aborted = true;
      };
   }, [src]);

   if (state.kind === "loading") return <>{fallback}</>;
   if (state.kind === "error") return <>{fallback}</>;

   if (state.kind === "too-large") {
      const mb = (state.size / 1_048_576).toFixed(1);
      return (
         <div className='p-8 text-center text-sm text-muted-foreground'>
            <p className='font-medium'>File is too large to preview inline</p>
            <p className='mt-1'>
               {mb} MB exceeds the 2 MB preview limit. Download the file to
               view it.
            </p>
         </div>
      );
   }

   return (
      <pre
         ref={preRef}
         className={
            className ??
            "font-mono text-sm whitespace-pre-wrap break-words p-4 overflow-auto max-h-[70vh]"
         }
      >
         {state.text}
      </pre>
   );
};
