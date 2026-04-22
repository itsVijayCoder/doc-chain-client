"use client";

import { FC } from "react";
import { Sparkles } from "lucide-react";

interface Props {
   mimeType?: string;
   isDocumentScoped: boolean;
   onPick: (prompt: string) => void;
}

const DEFAULT_SUGGESTIONS = [
   "Summarize this document",
   "What are the main points?",
   "List key dates and deadlines",
   "What are my permissions on this document?",
];

const GLOBAL_SUGGESTIONS = [
   "Which documents mention pricing?",
   "Find contracts expiring soon",
   "Show documents shared with me",
   "Find documents similar to this one",
];

const PDF_SUGGESTIONS = [
   "Summarize this document",
   "What are the key terms?",
   "List all dates and deadlines",
   "What are the obligations of each party?",
   "Check this document for compliance issues",
   "Extract all names and entities",
   "What are my permissions on this document?",
];

const SPREADSHEET_SUGGESTIONS = [
   "Summarize the data trends",
   "What are the highest and lowest values?",
   "What totals are in this sheet?",
   "Extract all numeric values and formulas",
];

const DOCX_SUGGESTIONS = [
   "Summarize this document",
   "What are the action items?",
   "List the key decisions",
   "Explain the main argument",
   "Translate this document to Spanish",
];

function pickPrompts(mime: string | undefined): string[] {
   if (!mime) return DEFAULT_SUGGESTIONS;
   if (mime === "application/pdf") return PDF_SUGGESTIONS;
   if (mime.includes("spreadsheetml") || mime === "text/csv")
      return SPREADSHEET_SUGGESTIONS;
   if (mime.includes("wordprocessingml")) return DOCX_SUGGESTIONS;
   return DEFAULT_SUGGESTIONS;
}

export const ChatSuggestions: FC<Props> = ({
   mimeType,
   isDocumentScoped,
   onPick,
}) => {
   const prompts = isDocumentScoped
      ? pickPrompts(mimeType)
      : GLOBAL_SUGGESTIONS;
   return (
      <div className='flex flex-col gap-2 w-full max-w-sm'>
         <div
            className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]'
            style={{ color: "var(--dc-text-dim)" }}
         >
            <Sparkles size={12} strokeWidth={1.75} style={{ color: "var(--dc-accent)" }} />
            Try asking
         </div>
         <div className='flex flex-col gap-1.5'>
            {prompts.map((prompt) => (
               <button
                  key={prompt}
                  type='button'
                  onClick={() => onPick(prompt)}
                  className='text-left text-[12px] rounded-md px-3 py-2 transition-colors'
                  style={{
                     background: "var(--dc-surface-2)",
                     border: "1px solid var(--dc-border)",
                     color: "var(--dc-text)",
                  }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.background = "var(--dc-surface-3)";
                     e.currentTarget.style.borderColor = "var(--dc-border-strong)";
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.background = "var(--dc-surface-2)";
                     e.currentTarget.style.borderColor = "var(--dc-border)";
                  }}
               >
                  {prompt}
               </button>
            ))}
         </div>
      </div>
   );
};
