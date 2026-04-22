"use client";

import { FC, KeyboardEvent, useRef } from "react";
import { Send } from "lucide-react";

interface Props {
   value: string;
   onChange: (value: string) => void;
   onSend: () => void;
   disabled?: boolean;
   placeholder?: string;
}

const MAX_ROWS = 6;

export const ChatInput: FC<Props> = ({
   value,
   onChange,
   onSend,
   disabled = false,
   placeholder = "Ask a question…",
}) => {
   const textareaRef = useRef<HTMLTextAreaElement>(null);

   const canSend = !disabled && value.trim().length > 0;

   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send, Shift+Enter for a new line — standard chat UX.
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         if (canSend) onSend();
      }
   };

   // Grow textarea up to MAX_ROWS then scroll internally.
   const handleInput = (nextValue: string) => {
      onChange(nextValue);
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const padding = 16;
      const maxHeight = lineHeight * MAX_ROWS + padding;
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
   };

   return (
      <div
         className='flex items-end gap-2 p-3'
         style={{
            borderTop: "1px solid var(--dc-border)",
            background: "var(--dc-surface-2)",
         }}
      >
         <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className='flex-1 resize-none rounded-md px-3 py-2 text-[13px] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text)",
               maxHeight: "140px",
            }}
            onFocus={(e) => {
               e.currentTarget.style.borderColor = "var(--dc-accent-border)";
               e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
            }}
            onBlur={(e) => {
               e.currentTarget.style.borderColor = "var(--dc-border)";
               e.currentTarget.style.boxShadow = "none";
            }}
         />
         <button
            type='button'
            onClick={onSend}
            disabled={!canSend}
            aria-label='Send'
            className='shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            style={{
               background: canSend ? "var(--dc-accent)" : "var(--dc-surface-3)",
               color: canSend ? "#061f15" : "var(--dc-text-dim)",
            }}
            onMouseEnter={(e) => {
               if (canSend) e.currentTarget.style.background = "var(--dc-accent-hover)";
            }}
            onMouseLeave={(e) => {
               if (canSend) e.currentTarget.style.background = "var(--dc-accent)";
            }}
         >
            <Send size={15} strokeWidth={2} />
         </button>
      </div>
   );
};
