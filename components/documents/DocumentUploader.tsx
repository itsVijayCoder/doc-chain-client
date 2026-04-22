"use client";

import { FC, useCallback, useState } from "react";
import {
   File,
   FileText,
   Image as ImageIcon,
   Lock,
   Plus,
   Upload,
   X,
} from "lucide-react";
import { useToast } from "@/lib/hooks/useToast";
import { DocumentMetadata } from "@/lib/types/document";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";
import {
   DcButton,
   DcInput,
   DcTextarea,
   Field,
} from "@/components/design/primitives";
import { Switch } from "@/components/ui/switch";

interface DocumentUploaderProps {
   onUpload: (file: File, metadata: DocumentMetadata) => Promise<void>;
   isUploading?: boolean;
   progress?: number;
}

// Every extension for which we have a preview path (or graceful fallback).
const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
   "application/pdf": [".pdf"],
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
   ],
   "application/msword": [".doc"],
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
   ],
   "application/vnd.ms-excel": [".xls"],
   "text/csv": [".csv"],
   "text/plain": [".txt", ".log"],
   "text/markdown": [".md", ".markdown"],
   "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"],
   "video/*": [".mp4", ".webm", ".mov", ".m4v"],
   "application/zip": [".zip"],
   "application/x-7z-compressed": [".7z"],
   "application/json": [".json"],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const DocumentUploader: FC<DocumentUploaderProps> = ({
   onUpload,
   isUploading = false,
   progress = 0,
}) => {
   const [isDragging, setIsDragging] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [metadata, setMetadata] = useState<DocumentMetadata>({
      title: "",
      description: "",
      tags: [],
      isEncrypted: false,
      isConfidential: false,
   });
   const [tagInput, setTagInput] = useState("");
   const toast = useToast();

   const validateFile = useCallback((file: File): string | null => {
      if (file.size > MAX_FILE_SIZE) {
         return `File size exceeds ${formatBytes(MAX_FILE_SIZE)}`;
      }
      return null;
   }, []);

   const handleFileSelect = useCallback(
      (file: File) => {
         const error = validateFile(file);
         if (error) {
            toast.error("Invalid file", error);
            return;
         }
         setSelectedFile(file);
         setMetadata((prev) => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, ""),
         }));
      },
      [validateFile, toast]
   );

   const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
   }, []);
   const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   }, []);
   const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
   }, []);
   const handleDrop = useCallback(
      (e: React.DragEvent) => {
         e.preventDefault();
         e.stopPropagation();
         setIsDragging(false);
         const files = e.dataTransfer.files;
         if (files.length > 0) handleFileSelect(files[0]);
      },
      [handleFileSelect]
   );

   const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
         const files = e.target.files;
         if (files && files.length > 0) handleFileSelect(files[0]);
      },
      [handleFileSelect]
   );

   const handleAddTag = useCallback(() => {
      if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
         setMetadata((prev) => ({
            ...prev,
            tags: [...prev.tags, tagInput.trim()],
         }));
         setTagInput("");
      }
   }, [tagInput, metadata.tags]);

   const handleRemoveTag = useCallback((tag: string) => {
      setMetadata((prev) => ({
         ...prev,
         tags: prev.tags.filter((t) => t !== tag),
      }));
   }, []);

   const handleUpload = useCallback(async () => {
      if (!selectedFile) return;
      if (!metadata.title.trim()) {
         toast.error("Title required", "Please enter a title for the document");
         return;
      }
      try {
         await onUpload(selectedFile, metadata);
         setSelectedFile(null);
         setMetadata({
            title: "",
            description: "",
            tags: [],
            isEncrypted: false,
            isConfidential: false,
         });
         setTagInput("");
      } catch {
         // Parent handles error toast
      }
   }, [selectedFile, metadata, onUpload, toast]);

   const renderFileIcon = (size: number) => {
      const color = "var(--dc-text-muted)";
      if (!selectedFile) return <Upload size={size} style={{ color }} />;
      if (selectedFile.type.startsWith("image/"))
         return <ImageIcon size={size} style={{ color }} />;
      if (selectedFile.type === "application/pdf")
         return <FileText size={size} style={{ color }} />;
      return <File size={size} style={{ color }} />;
   };

   return (
      <div className='space-y-5'>
         {/* Drop zone */}
         <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
               "relative rounded-xl p-6 text-center transition-all",
               isUploading && "pointer-events-none opacity-60"
            )}
            style={{
               border: `1.5px dashed ${
                  isDragging ? "var(--dc-accent-border)" : "var(--dc-border-strong)"
               }`,
               background: isDragging
                  ? "var(--dc-accent-soft)"
                  : "var(--dc-surface-2)",
            }}
         >
            <input
               type='file'
               id='file-upload'
               className='hidden'
               onChange={handleFileInputChange}
               accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(",")}
               disabled={isUploading}
            />

            {!selectedFile ? (
               <label
                  htmlFor='file-upload'
                  className='cursor-pointer flex flex-col items-center gap-3 py-6'
               >
                  <div
                     className='w-14 h-14 rounded-full flex items-center justify-center'
                     style={{
                        background: "var(--dc-surface)",
                        border: "1px solid var(--dc-border)",
                        color: isDragging ? "var(--dc-accent)" : "var(--dc-text-muted)",
                     }}
                  >
                     <Upload size={22} strokeWidth={1.75} />
                  </div>
                  <div>
                     <p
                        className='text-[14px] font-medium'
                        style={{ color: "var(--dc-text)" }}
                     >
                        {isDragging
                           ? "Drop to upload"
                           : "Drag and drop your file here"}
                     </p>
                     <p
                        className='text-[12px] mt-1'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        or click to browse
                     </p>
                  </div>
                  <p
                     className='text-[11px]'
                     style={{ color: "var(--dc-text-faint)" }}
                  >
                     PDF, Word, Excel, CSV, Markdown, text, images, video · max{" "}
                     {formatBytes(MAX_FILE_SIZE)}
                  </p>
               </label>
            ) : (
               <div className='flex items-start gap-3 text-left'>
                  <div
                     className='w-11 h-11 rounded-md flex items-center justify-center shrink-0'
                     style={{
                        background: "var(--dc-surface)",
                        border: "1px solid var(--dc-border)",
                     }}
                  >
                     {renderFileIcon(20)}
                  </div>
                  <div className='flex-1 min-w-0'>
                     <p
                        className='text-[13px] font-semibold truncate'
                        style={{ color: "var(--dc-text)" }}
                        title={selectedFile.name}
                     >
                        {selectedFile.name}
                     </p>
                     <p
                        className='text-[11.5px] mt-0.5 tabular-nums'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        {formatBytes(selectedFile.size)}
                     </p>
                  </div>
                  <button
                     type='button'
                     onClick={() => setSelectedFile(null)}
                     disabled={isUploading}
                     aria-label='Remove file'
                     className='w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0 disabled:opacity-50'
                     style={{ color: "var(--dc-text-muted)" }}
                     onMouseEnter={(e) => {
                        if (!isUploading) {
                           e.currentTarget.style.background = "var(--dc-surface-3)";
                           e.currentTarget.style.color = "var(--dc-text)";
                        }
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--dc-text-muted)";
                     }}
                  >
                     <X size={14} strokeWidth={1.75} />
                  </button>
               </div>
            )}

            {/* Progress bar — pinned to the bottom edge of the drop zone */}
            {isUploading && (
               <div
                  className='absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden'
                  style={{ background: "var(--dc-surface-3)" }}
               >
                  <div
                     className='h-full transition-all duration-300'
                     style={{
                        width: `${progress}%`,
                        background: "var(--dc-accent)",
                     }}
                  />
               </div>
            )}
         </div>

         {/* Metadata form — appears after a file is selected */}
         {selectedFile && (
            <div className='space-y-4'>
               <Field label='Title' required htmlFor='up-title'>
                  <DcInput
                     id='up-title'
                     value={metadata.title}
                     onChange={(v) =>
                        setMetadata((prev) => ({ ...prev, title: v }))
                     }
                     placeholder='Enter document title'
                     disabled={isUploading}
                  />
               </Field>

               <Field label='Description' htmlFor='up-desc'>
                  <DcTextarea
                     id='up-desc'
                     value={metadata.description ?? ""}
                     onChange={(v) =>
                        setMetadata((prev) => ({ ...prev, description: v }))
                     }
                     placeholder='What is this document about?'
                     rows={3}
                     disabled={isUploading}
                  />
               </Field>

               <Field label='Tags' htmlFor='up-tags'>
                  <div className='flex gap-2'>
                     <DcInput
                        id='up-tags'
                        value={tagInput}
                        onChange={setTagInput}
                        placeholder='Add a tag and press Enter'
                        disabled={isUploading}
                        onKeyDown={(e) => {
                           if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                           }
                        }}
                     />
                     <DcButton
                        icon={<Plus size={14} strokeWidth={2} />}
                        onClick={handleAddTag}
                        disabled={isUploading || !tagInput.trim()}
                     >
                        Add
                     </DcButton>
                  </div>
                  {metadata.tags.length > 0 && (
                     <div className='flex flex-wrap gap-1.5 mt-2'>
                        {metadata.tags.map((tag) => (
                           <button
                              key={tag}
                              type='button'
                              onClick={() => handleRemoveTag(tag)}
                              className='inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full text-[11.5px] font-medium transition-colors'
                              style={{
                                 background: "var(--dc-surface-2)",
                                 color: "var(--dc-text-muted)",
                                 border: "1px solid var(--dc-border)",
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.background =
                                    "var(--dc-surface-3)";
                                 e.currentTarget.style.color = "var(--dc-text)";
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.background =
                                    "var(--dc-surface-2)";
                                 e.currentTarget.style.color =
                                    "var(--dc-text-muted)";
                              }}
                              title='Remove tag'
                           >
                              {tag}
                              <X size={11} strokeWidth={2} />
                           </button>
                        ))}
                     </div>
                  )}
               </Field>

               {/* Confidential toggle — mirrors the detail-page banner's
                   amber palette. Flipping this sets is_confidential=true
                   on the multipart upload so the backend routes every
                   future download through the forensic watermark path. */}
               <label
                  htmlFor='up-confidential'
                  className='flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors'
                  style={{
                     background: metadata.isConfidential
                        ? "var(--dc-warn-soft)"
                        : "var(--dc-surface-2)",
                     border: `1px solid ${
                        metadata.isConfidential
                           ? "var(--dc-warn-border)"
                           : "var(--dc-border)"
                     }`,
                  }}
               >
                  <div
                     className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
                     style={{
                        background: metadata.isConfidential
                           ? "var(--dc-warn-border)"
                           : "var(--dc-surface)",
                        border: `1px solid ${
                           metadata.isConfidential
                              ? "var(--dc-warn-border)"
                              : "var(--dc-border)"
                        }`,
                        color: metadata.isConfidential
                           ? "var(--dc-warn)"
                           : "var(--dc-text-muted)",
                     }}
                  >
                     <Lock size={15} strokeWidth={2} />
                  </div>
                  <div className='flex-1 min-w-0'>
                     <div
                        className='text-[13px] font-semibold'
                        style={{ color: "var(--dc-text)" }}
                     >
                        Mark as Confidential
                     </div>
                     <div
                        className='text-[11.5px] mt-0.5 leading-snug'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        Downloads will be forensically watermarked so leaks
                        can be traced back to the downloader.
                     </div>
                  </div>
                  <Switch
                     id='up-confidential'
                     checked={!!metadata.isConfidential}
                     onCheckedChange={(checked) =>
                        setMetadata((prev) => ({
                           ...prev,
                           isConfidential: checked,
                        }))
                     }
                     disabled={isUploading}
                  />
               </label>

               <DcButton
                  variant='primary'
                  onClick={handleUpload}
                  disabled={isUploading || !metadata.title.trim()}
                  className='w-full justify-center'
                  icon={<Upload size={14} strokeWidth={2} />}
               >
                  {isUploading
                     ? `Uploading… ${progress}%`
                     : "Upload Document"}
               </DcButton>
            </div>
         )}
      </div>
   );
};

