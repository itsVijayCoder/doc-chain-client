"use client";

import {
   FC,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAuthBlob } from "@/lib/services/authFetch";
import { documentService } from "@/lib/services/documentService";
import { useHighlightStore } from "@/lib/stores/highlightStore";
import {
   findPhraseRange,
   phraseCandidates,
   rangeRectsRelativeTo,
   type OverlayRect,
} from "@/lib/utils/pdfHighlight";

// Wire the pdf.js worker. new URL(..., import.meta.url) tells Turbopack to
// emit the worker as a separate asset and produce a correct absolute URL to
// it at build time — no need to copy anything into /public.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   "pdfjs-dist/build/pdf.worker.min.mjs",
   import.meta.url
).toString();

interface Props {
   src: string;
   title?: string;
   documentId?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;

// Module-scope stable reference — inline object literals on the Document
// prop cause a reprocess and detach the ArrayBuffer transferred to the
// worker on the first pass.
const PDF_OPTIONS = {
   isEvalSupported: false,
};

const PdfJsViewer: FC<Props> = ({ src, title, documentId }) => {
   const blobQuery = useQuery({
      queryKey: ["viewer", "pdf", src],
      queryFn: () => fetchAuthBlob(src),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
   });

   const [numPages, setNumPages] = useState<number>(0);
   const [pageNumber, setPageNumber] = useState<number>(1);
   const [scale, setScale] = useState<number>(1);
   const scrollAreaRef = useRef<HTMLDivElement | null>(null);
   const pageContainerRef = useRef<HTMLDivElement | null>(null);

   // Overlay layer — absolute-positioned rectangles drawn over the current
   // page's canvas. Cleared on page change. Populated either from a client-
   // side text-layer match or from the Vision API fallback.
   const [highlightRects, setHighlightRects] = useState<OverlayRect[]>([]);
   const [textLayerRevision, setTextLayerRevision] = useState(0);

   const file = useMemo(() => blobQuery.data ?? null, [blobQuery.data]);

   const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
   }, []);

   const onRenderTextLayerSuccess = useCallback(() => {
      setTextLayerRevision((r) => r + 1);
   }, []);

   // ───────────────────────────────────────────────────────────────────
   // Clear the scroll + overlays when the page changes. Each new page
   // starts at its top; old highlight rects (which reference the previous
   // page's canvas) are now stale.
   // ───────────────────────────────────────────────────────────────────
   useEffect(() => {
      scrollAreaRef.current?.scrollTo({ top: 0, left: 0 });
      // Stale-rects-on-page-change reset. The alternative (key on overlay
      // wrapper) would remount the highlight DOM unnecessarily on every
      // pageNumber tick, which is more churn than a single setState.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightRects([]);
   }, [pageNumber]);

   // Zoom changes shift text layer positions, so drop old rects — the
   // next render cycle re-computes against the new dimensions.
   // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to external scale event
   useEffect(() => setHighlightRects([]), [scale]);

   // ───────────────────────────────────────────────────────────────────
   // Page navigation from highlight requests
   // ───────────────────────────────────────────────────────────────────
   const pendingHighlight = useHighlightStore((s) => s.pending);
   const lastHighlightId = useRef<string | null>(null);

   useEffect(() => {
      if (!pendingHighlight || !documentId) return;
      if (pendingHighlight.documentId !== documentId) return;
      if (pendingHighlight.id === lastHighlightId.current) return;
      if (typeof pendingHighlight.page === "number" && numPages > 0) {
         const clamped = Math.max(
            1,
            Math.min(numPages, pendingHighlight.page)
         );
         // DIAGNOSTIC — page off-by-one investigation. Remove once settled.
         console.log("[PdfJsViewer] navigate to page", {
            incoming: pendingHighlight.page,
            clamped,
            numPages,
         });
         // eslint-disable-next-line react-hooks/set-state-in-effect
         setPageNumber(clamped);
      }
      lastHighlightId.current = pendingHighlight.id;
   }, [pendingHighlight, documentId, numPages]);

   // ───────────────────────────────────────────────────────────────────
   // In-page text highlight — runs after the text layer renders. Tries
   // the client-side text layer search first. If the phrase isn't found
   // (scanned PDF, cross-node text ordering, etc.), falls back to the
   // backend Vision API which returns pixel-level boxes.
   // ───────────────────────────────────────────────────────────────────
   useEffect(() => {
      if (!pendingHighlight || !documentId) return;
      if (pendingHighlight.documentId !== documentId) return;
      if (textLayerRevision === 0) return; // text layer hasn't rendered yet
      const snippet = pendingHighlight.snippet;
      if (!snippet) return;

      const pageContainer = pageContainerRef.current;
      if (!pageContainer) return;
      // react-pdf applies both `react-pdf__Page__textContent` AND `textLayer`
      // classes. Try the former first (more specific), fall back to the
      // generic pdf.js class in case the compound className changes later.
      const textLayer =
         pageContainer.querySelector<HTMLElement>(
            ".react-pdf__Page__textContent"
         ) ?? pageContainer.querySelector<HTMLElement>(".textLayer");
      if (!textLayer) return;

      const candidates = phraseCandidates(snippet);
      let aborted = false;

      // ── Client-side: try each candidate phrase, longest first. Stop at
      //    the first hit. Normalized whitespace matching is handled inside
      //    findPhraseRange so snippet vs text-layer spacing mismatches
      //    don't cause misses.
      for (const phrase of candidates) {
         const range = findPhraseRange(textLayer, phrase);
         if (!range) continue;
         const rects = rangeRectsRelativeTo(range, pageContainer);
         if (rects.length === 0) continue;
         setHighlightRects(rects);
         const scrollArea = scrollAreaRef.current;
         if (scrollArea) {
            const target = rects[0].top - scrollArea.clientHeight / 3;
            scrollArea.scrollTo({ top: target, behavior: "smooth" });
         }
         return;
      }

      // ── Fallback: backend Vision API. Only meaningful when we know the
      //    page — without it the backend can't narrow the search.
      if (typeof pendingHighlight.page !== "number") {
         if (process.env.NODE_ENV !== "production") {
            console.warn(
               "[PdfJsViewer] No text-layer match and no page hint — skipping Vision fallback.",
               { snippet, candidates }
            );
         }
         return;
      }
      const canvas =
         pageContainer.querySelector<HTMLCanvasElement>("canvas");
      if (!canvas) return;

      const { width: canvasWidth, height: canvasHeight } =
         canvas.getBoundingClientRect();
      const offsetLeft = canvas.offsetLeft;
      const offsetTop = canvas.offsetTop;

      documentService
         .getHighlights(
            documentId,
            pendingHighlight.page,
            candidates[0] ?? snippet
         )
         .then((result) => {
            if (aborted) return;
            if (result.highlights.length === 0) {
               if (process.env.NODE_ENV !== "production") {
                  console.warn("[PdfJsViewer] Vision API returned no highlights.", {
                     method: result.method,
                     message: result.message,
                  });
               }
               return;
            }
            const rects: OverlayRect[] = result.highlights.map((h) => ({
               left: offsetLeft + h.x * canvasWidth,
               top: offsetTop + h.y * canvasHeight,
               width: h.width * canvasWidth,
               height: h.height * canvasHeight,
            }));
            setHighlightRects(rects);
            const scrollArea = scrollAreaRef.current;
            if (scrollArea && rects[0]) {
               const target = rects[0].top - scrollArea.clientHeight / 3;
               scrollArea.scrollTo({ top: target, behavior: "smooth" });
            }
         })
         .catch((err) => {
            if (process.env.NODE_ENV !== "production") {
               console.warn("[PdfJsViewer] Vision API call failed:", err);
            }
         });

      return () => {
         aborted = true;
      };
   }, [
      pendingHighlight,
      documentId,
      textLayerRevision,
      pageNumber,
      scale,
   ]);

   if (blobQuery.isLoading) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Loading PDF…
         </div>
      );
   }

   if (blobQuery.isError || !blobQuery.data) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Failed to load PDF.
         </div>
      );
   }

   return (
      <div className='flex flex-col h-[80vh]'>
         {/* Toolbar */}
         <div className='flex items-center justify-between gap-2 p-3 border-b bg-background/80 backdrop-blur shrink-0'>
            <div className='flex items-center gap-1'>
               <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
               >
                  <ChevronLeft size={16} />
               </Button>
               <span className='text-sm min-w-24 text-center'>
                  Page {pageNumber} / {numPages || "—"}
               </span>
               <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                     setPageNumber((p) => Math.min(numPages, p + 1))
                  }
                  disabled={pageNumber >= numPages}
               >
                  <ChevronRight size={16} />
               </Button>
            </div>
            <div className='flex items-center gap-1'>
               <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                     setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))
                  }
                  disabled={scale <= MIN_SCALE}
               >
                  <ZoomOut size={16} />
               </Button>
               <span className='text-xs min-w-12 text-center tabular-nums'>
                  {Math.round(scale * 100)}%
               </span>
               <Button
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                     setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))
                  }
                  disabled={scale >= MAX_SCALE}
               >
                  <ZoomIn size={16} />
               </Button>
            </div>
         </div>

         {/* Page canvas */}
         <div
            ref={scrollAreaRef}
            className='flex-1 overflow-auto bg-muted/30 p-4 flex justify-center'
         >
            <div ref={pageContainerRef} className='relative'>
               <Document
                  file={file}
                  onLoadSuccess={onLoadSuccess}
                  loading={
                     <div className='p-12 text-sm text-muted-foreground'>
                        Rendering…
                     </div>
                  }
                  error={
                     <div className='p-12 text-sm text-muted-foreground'>
                        Could not render this PDF.
                     </div>
                  }
                  options={PDF_OPTIONS}
               >
                  <Page
                     key={`${pageNumber}-${scale}`}
                     pageNumber={pageNumber}
                     scale={scale}
                     renderAnnotationLayer
                     renderTextLayer
                     onRenderTextLayerSuccess={onRenderTextLayerSuccess}
                     className='shadow-lg'
                  />
               </Document>

               {/* Highlight overlay — absolutely positioned over the page.
                   pointer-events:none lets users still select text beneath. */}
               {highlightRects.map((r, i) => (
                  <div
                     key={i}
                     className='absolute pointer-events-none rounded-sm bg-yellow-300/25 ring-1 ring-yellow-400/40 transition-opacity duration-200'
                     style={{
                        left: r.left,
                        top: r.top,
                        width: r.width,
                        height: r.height,
                     }}
                  />
               ))}
            </div>
         </div>

         {title && (
            <span className='sr-only' aria-live='polite'>
               {title}
            </span>
         )}
      </div>
   );
};

export default PdfJsViewer;
