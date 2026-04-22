"use client";

import { FC } from "react";
import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";

/**
 * Floating chat action button. Fixed bottom-right across the dashboard;
 * toggles the chat window. Icon flips to X when the window is open for a
 * single-control open/close ergonomic.
 */
export const ChatBubble: FC = () => {
   const isOpen = useChatStore((s) => s.isOpen);
   const toggle = useChatStore((s) => s.toggle);

   return (
      <button
         type='button'
         onClick={toggle}
         aria-label={isOpen ? "Close chat" : "Open chat"}
         aria-expanded={isOpen}
         className='fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none'
         style={{
            background: "var(--dc-accent)",
            color: "#061f15",
            boxShadow:
               "0 0 0 1px var(--dc-accent-border), 0 12px 32px rgba(16, 185, 129, 0.28), 0 4px 12px rgba(0, 0, 0, 0.25)",
         }}
         onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--dc-accent-hover)")
         }
         onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--dc-accent)")
         }
      >
         {isOpen ? <X size={20} strokeWidth={2.25} /> : <MessageCircle size={20} strokeWidth={2} />}
      </button>
   );
};
