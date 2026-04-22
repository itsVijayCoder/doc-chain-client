"use client";

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import {
   AlertTriangle,
   CheckCircle2,
   Clock,
   Droplet,
   FileImage,
   FileText,
   Fingerprint,
   Loader2,
   Mail,
   Shield,
   Upload,
   User,
   XCircle,
} from "lucide-react";
import {
   adminService,
   type TraceWatermarkResponse,
} from "@/lib/services/adminService";
import {
   DcButton,
   PageHead,
   Panel,
} from "@/components/design/primitives";

export default function WatermarkTracePage() {
   const { user, isLoading } = useAuth();

   useEffect(() => {
      if (!isLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, isLoading]);

   const [isDragging, setIsDragging] = useState(false);
   const [tracing, setTracing] = useState(false);
   const [result, setResult] = useState<TraceWatermarkResponse | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [fileName, setFileName] = useState<string | null>(null);
   const inputRef = useRef<HTMLInputElement>(null);

   const handleFile = useCallback(async (file: File) => {
      const allowed = ["application/pdf", "image/png", "image/bmp"];
      if (!allowed.includes(file.type)) {
         setError("Only PDF, PNG, and BMP files are supported.");
         return;
      }
      setFileName(file.name);
      setResult(null);
      setError(null);
      setTracing(true);
      try {
         const res = await adminService.traceWatermark(file);
         setResult(res);
      } catch (err: unknown) {
         const msg =
            err && typeof err === "object" && "message" in err
               ? String((err as { message: string }).message)
               : "Trace failed. Please try again.";
         setError(msg);
      } finally {
         setTracing(false);
      }
   }, []);

   const onDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
         e.preventDefault();
         setIsDragging(false);
         const file = e.dataTransfer.files[0];
         if (file) handleFile(file);
      },
      [handleFile]
   );

   const onInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (file) handleFile(file);
         e.target.value = "";
      },
      [handleFile]
   );

   const methodLabel: Record<string, string> = {
      lsb: "LSB Steganography (Image)",
      pdf_metadata: "PDF Metadata Embed",
      not_found: "No Watermark Found",
   };

   if (isLoading) {
      return (
         <div className='flex items-center justify-center min-h-screen'>
            <div
               className='w-12 h-12 rounded-full border-b-2 animate-spin'
               style={{ borderColor: "var(--dc-accent)" }}
            />
         </div>
      );
   }

   if (!user || !isAdmin(user.role)) return null;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] max-w-[720px] mx-auto'>
         <PageHead
            title='Watermark Trace'
            titleIcon={<Droplet size={22} strokeWidth={1.75} />}
            subtitle={
               <span>
                  Upload a suspect file to extract the embedded forensic watermark
                  and identify who downloaded it.
               </span>
            }
         />

         {/* ── Format callout row ───────────────────────────────── */}
         <div
            className='flex flex-wrap items-center gap-5 mb-4 text-[12px]'
            style={{ color: "var(--dc-text-muted)" }}
         >
            <span className='flex items-center gap-1.5'>
               <FileImage size={12} strokeWidth={1.75} />
               <strong style={{ color: "var(--dc-text)", fontWeight: 600 }}>
                  PNG / BMP
               </strong>{" "}
               — LSB steganography
            </span>
            <span className='flex items-center gap-1.5'>
               <FileText size={12} strokeWidth={1.75} />
               <strong style={{ color: "var(--dc-text)", fontWeight: 600 }}>
                  PDF
               </strong>{" "}
               — metadata embed
            </span>
         </div>

         {/* ── Dropzone ─────────────────────────────────────────── */}
         <div
            className='rounded-2xl flex flex-col items-center justify-center gap-3.5 text-center py-16 px-5 cursor-pointer transition-all'
            style={{
               border: `1.5px dashed ${
                  isDragging ? "var(--dc-accent-border)" : "var(--dc-border-strong)"
               }`,
               background: isDragging ? "var(--dc-accent-soft)" : "var(--dc-surface)",
            }}
            onDragOver={(e) => {
               e.preventDefault();
               setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onMouseEnter={(e) => {
               if (!isDragging && !tracing) {
                  e.currentTarget.style.borderColor = "var(--dc-accent-border)";
                  e.currentTarget.style.background = "var(--dc-surface-2)";
               }
            }}
            onMouseLeave={(e) => {
               if (!isDragging) {
                  e.currentTarget.style.borderColor = "var(--dc-border-strong)";
                  e.currentTarget.style.background = "var(--dc-surface)";
               }
            }}
         >
            <input
               ref={inputRef}
               type='file'
               accept='.pdf,.png,.bmp'
               className='hidden'
               onChange={onInputChange}
            />
            <div
               className='w-12 h-12 rounded-full flex items-center justify-center transition-colors'
               style={{
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border)",
                  color: isDragging ? "var(--dc-accent)" : "var(--dc-text-muted)",
               }}
            >
               <Upload size={20} strokeWidth={1.75} />
            </div>
            <div>
               <div
                  className='text-[14px] font-medium'
                  style={{ color: "var(--dc-text)" }}
               >
                  {isDragging ? "Drop to trace…" : "Drop file here or click to browse"}
               </div>
               <div
                  className='text-[12px] mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  PDF, PNG, BMP — max 50 MB
               </div>
            </div>

            {tracing && (
               <div
                  className='flex items-center gap-2 text-[12px] mt-1'
                  style={{ color: "var(--dc-text-muted)" }}
               >
                  <Loader2
                     size={14}
                     className='animate-spin'
                     style={{ color: "var(--dc-accent)" }}
                  />
                  Analyzing {fileName}…
               </div>
            )}
         </div>

         {/* ── Info callout ─────────────────────────────────────── */}
         <div
            className='mt-4 flex items-start gap-3 p-3.5 rounded-xl'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
            }}
         >
            <Shield
               size={16}
               strokeWidth={1.75}
               style={{ color: "var(--dc-info)", flexShrink: 0, marginTop: 2 }}
            />
            <div
               className='text-[12px] leading-relaxed'
               style={{ color: "var(--dc-text-muted)" }}
            >
               Every download is watermarked with a hidden fingerprint tied to
               the user, session, and document version. Drop a suspected leak
               here to reverse-engineer the trail.
            </div>
         </div>

         {/* ── Error ────────────────────────────────────────────── */}
         {error && (
            <div
               className='mt-4 flex items-start gap-3 p-3.5 rounded-xl text-[13px]'
               style={{
                  background: "var(--dc-danger-soft)",
                  border: "1px solid var(--dc-danger-border)",
                  color: "var(--dc-danger)",
               }}
            >
               <AlertTriangle
                  size={16}
                  strokeWidth={1.75}
                  style={{ flexShrink: 0, marginTop: 2 }}
               />
               {error}
            </div>
         )}

         {/* ── Result ───────────────────────────────────────────── */}
         {result && (
            <div className='mt-4'>
               <Panel
                  title={
                     <span className='flex items-center gap-2'>
                        {result.found ? (
                           <CheckCircle2
                              size={14}
                              strokeWidth={2}
                              style={{ color: "var(--dc-accent)" }}
                           />
                        ) : (
                           <XCircle
                              size={14}
                              strokeWidth={2}
                              style={{ color: "var(--dc-text-muted)" }}
                           />
                        )}
                        {result.found ? "Watermark Detected" : "No Watermark Found"}
                     </span>
                  }
                  action={
                     <span
                        className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                        style={
                           result.found
                              ? {
                                   background: "var(--dc-accent-soft)",
                                   color: "var(--dc-accent)",
                                   border: "1px solid var(--dc-accent-border)",
                                }
                              : {
                                   background: "var(--dc-surface-2)",
                                   color: "var(--dc-text-muted)",
                                   border: "1px solid var(--dc-border)",
                                }
                        }
                     >
                        {methodLabel[result.method] ?? result.method}
                     </span>
                  }
                  flushBody
               >
                  {result.found ? (
                     <div>
                        {result.name && (
                           <ResultRow
                              icon={<User size={14} strokeWidth={1.75} />}
                              label='Name'
                              value={result.name}
                           />
                        )}
                        {result.email && (
                           <ResultRow
                              icon={<Mail size={14} strokeWidth={1.75} />}
                              label='Email'
                              value={result.email}
                           />
                        )}
                        {result.user_id && (
                           <ResultRow
                              icon={
                                 <Fingerprint size={14} strokeWidth={1.75} />
                              }
                              label='User ID'
                              value={result.user_id}
                              mono
                           />
                        )}
                        {result.timestamp && (
                           <ResultRow
                              icon={<Clock size={14} strokeWidth={1.75} />}
                              label='Download timestamp'
                              value={new Date(result.timestamp).toLocaleString()}
                              last
                           />
                        )}
                     </div>
                  ) : (
                     <div
                        className='px-6 py-8 text-center'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        <p className='text-[13px]'>
                           No forensic watermark could be extracted from{" "}
                           <span
                              style={{
                                 color: "var(--dc-text)",
                                 fontWeight: 500,
                              }}
                           >
                              {fileName}
                           </span>
                           .
                        </p>
                        <p
                           className='text-[11.5px] mt-1'
                           style={{ color: "var(--dc-text-faint)" }}
                        >
                           The file may not have been downloaded through the
                           forensic watermark flow, or may have been modified.
                        </p>
                     </div>
                  )}

                  <div
                     className='px-4 py-3 flex justify-end'
                     style={{
                        borderTop: "1px solid var(--dc-border)",
                        background: "var(--dc-surface-2)",
                     }}
                  >
                     <DcButton
                        size='sm'
                        onClick={() => {
                           setResult(null);
                           setFileName(null);
                           setError(null);
                        }}
                     >
                        Trace Another File
                     </DcButton>
                  </div>
               </Panel>
            </div>
         )}
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Result row — icon + label + value with hairline border
// ─────────────────────────────────────────────────────────────────────
const ResultRow: FC<{
   icon: ReactNode;
   label: string;
   value: ReactNode;
   mono?: boolean;
   last?: boolean;
}> = ({ icon, label, value, mono, last }) => (
   <div
      className='flex items-center gap-3 px-4 py-3'
      style={{
         borderBottom: last ? "none" : "1px solid var(--dc-border)",
      }}
   >
      <div
         className='w-7 h-7 rounded-md flex items-center justify-center shrink-0'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text-muted)",
         }}
      >
         {icon}
      </div>
      <div className='min-w-0'>
         <div
            className='text-[10.5px] font-semibold uppercase tracking-[0.06em]'
            style={{ color: "var(--dc-text-dim)" }}
         >
            {label}
         </div>
         <div
            className='text-[13px] mt-0.5 truncate'
            style={{
               color: "var(--dc-text)",
               fontFamily: mono ? "var(--dc-font-mono)" : undefined,
               fontSize: mono ? 12 : 13,
            }}
         >
            {value}
         </div>
      </div>
   </div>
);
