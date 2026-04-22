"use client";

import { FC, useEffect, useState } from "react";
import api from "@/lib/services/api";

interface Props {
   /**
    * Path or URL returned by the backend. If it starts with `/api/v1/…` we
    * strip that prefix since the axios baseURL already includes it; anything
    * else is passed through as-is (the axios instance resolves it correctly).
    */
   src: string;
   alt?: string;
   className?: string;
   /** Rendered while the blob is fetching. Defaults to a muted placeholder. */
   fallback?: React.ReactNode;
}

/**
 * Renders an <img> whose source is an authenticated backend endpoint.
 * Browsers can't attach Authorization headers to <img src>, so we fetch the
 * bytes through axios (which does have the token) and expose them as a
 * blob: URL. Cleans up the object URL on unmount / src change.
 */
export const AuthenticatedImage: FC<Props> = ({
   src,
   alt,
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
            const url = URL.createObjectURL(res.data);
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

   // Render the fallback for both pre-load and post-error states. Callers
   // pass a neutral placeholder (icon, skeleton) that works as both "loading"
   // and "couldn't load" — UI stays visually stable either way.
   if (errored || !objectUrl) return <>{fallback}</>;

   // eslint-disable-next-line @next/next/no-img-element
   return <img src={objectUrl} alt={alt} className={className} />;
};
