import api from "./api";

/**
 * Fetch an authenticated backend resource as a Blob. Strips a leading
 * `/api/v1` prefix so callers can pass either the raw path the backend
 * returns or a relative one. Used by viewers that need to transform the
 * file bytes (pdf.js, mammoth, SheetJS) inside a TanStack query.
 */
export async function fetchAuthBlob(src: string): Promise<Blob> {
   const relative = src.replace(/^\/api\/v1/, "");
   const res = await api.get<Blob>(relative, { responseType: "blob" });
   return res.data;
}
