"use client";

import { FC, useEffect, useState } from "react";
import api from "@/lib/services/api";

interface Props {
   /**
    * Path or URL to the PDF endpoint. Leading `/api/v1` is stripped since the
    * axios baseURL already includes it; everything else passes through.
    */
   src: string;
   title?: string;
   className?: string;
   fallback?: React.ReactNode;
}

/**
 * Renders a PDF whose source is an authenticated backend endpoint. The
 * browser can't attach Authorization headers to an iframe's `src`, so we
 * fetch the bytes through axios, build a `blob:` URL with an explicit
 * `application/pdf` MIME type, and hand that to the iframe. The browser's
 * native PDF viewer (Chrome's built-in, Firefox's pdf.js) renders it.
 */
export const AuthenticatedPdfEmbed: FC<Props> = ({
   src,
   title,
   className,
   fallback = null,
}) => {
   const [objectUrl, setObjectUrl] = useState<string | null>(null);
   const [errored, setErrored] = useState(false);

   useEffect(() => {
      let createdUrl: string | null = null;
      let aborted = false;

      const relative = src.replace(/^\/api\/v1/, "");

      api.get<Blob>(relative, { responseType: "blob" })
         .then((res) => {
            if (aborted) return;
            // Force application/pdf so the browser picks its PDF viewer even
            // when the server's response lacks / overrides the content type.
            const pdfBlob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);
            createdUrl = url;
            setObjectUrl(url);
         })
         .catch(() => {
            if (!aborted) setErrored(true);
         });

      return () => {
         aborted = true;
         if (createdUrl) URL.revokeObjectURL(createdUrl);
      };
   }, [src]);

   if (errored || !objectUrl) return <>{fallback}</>;

   return (
      <iframe
         src={objectUrl}
         title={title ?? "Document preview"}
         className={className}
      />
   );
};
