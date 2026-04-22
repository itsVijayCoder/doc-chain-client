"use client";

import { FC, useEffect, useState } from "react";
import api from "@/lib/services/api";

interface Props {
   src: string;
   mimeType?: string;
   className?: string;
   fallback?: React.ReactNode;
}

/**
 * Renders a video from an authenticated backend endpoint. Fetches the full
 * file as a blob and plays it via the native <video> controls. For large
 * videos this is not ideal — proper streaming would require range-request
 * support and a signed token in the URL. Acceptable for MVP-sized clips.
 */
export const AuthenticatedVideo: FC<Props> = ({
   src,
   mimeType,
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
            // Use the hint when the backend's Content-Type is generic.
            const blob = mimeType
               ? new Blob([res.data], { type: mimeType })
               : res.data;
            const url = URL.createObjectURL(blob);
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
   }, [src, mimeType]);

   if (errored || !objectUrl) return <>{fallback}</>;

   return (
      <video
         src={objectUrl}
         controls
         className={className}
         preload='metadata'
      />
   );
};
