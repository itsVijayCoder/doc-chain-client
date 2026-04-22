"use client";

import { FC, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
   AlertCircle,
   AlertTriangle,
   Archive,
   ArrowRight,
   Bot,
   Calendar,
   CheckCircle2,
   DollarSign,
   ExternalLink,
   FileText,
   Folder,
   MapPin,
   Percent,
   Quote,
   Search,
   Send,
   Share2,
   Tag,
   User,
   Wrench,
   Zap,
} from "lucide-react";
import type {
   ChatAction,
   ChatAnchor,
   ChatMessage as ChatMessageType,
   ChatSource,
   ProcessingStep,
} from "@/lib/services/chatService";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/format";

// Light preprocessing for common AI formatting quirks that aren't technically
// markdown but users expect to render as lists. We insert newlines before
// "1) " / "2) " sequences so they parse as list-like blocks, and normalize
// stray whitespace. Surgical — doesn't disturb real markdown.
function normalizeAssistantMarkdown(raw: string): string {
   // Break a run-on paragraph with inline numbered markers into separate lines
   // only when the markers look intentional (preceded by a sentence end).
   return raw
      .replace(/([.!?])\s+(\d{1,2})\)\s+/g, "$1\n\n$2. ")
      .replace(/^(\d{1,2})\)\s+/gm, "$1. ");
}

interface ConfidenceStyle {
   Icon: typeof CheckCircle2;
   label: string;
   description: string;
   className: string;
}

/**
 * Map backend confidence → icon, label, and semantic color. Unknown values
 * return null so the badge renders nothing (forward-compatible).
 */
function confidenceStyle(confidence?: string): ConfidenceStyle | null {
   switch (confidence) {
      case "high":
         return {
            Icon: CheckCircle2,
            label: "Confident",
            description: "This answer is explicitly supported by the document.",
            className:
               "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
         };
      case "medium":
         return {
            Icon: AlertCircle,
            label: "Inferred",
            description:
               "The AI inferred this from context — double-check sources.",
            className: "text-amber-600 bg-amber-500/10 border-amber-500/30",
         };
      case "low":
         return {
            Icon: AlertTriangle,
            label: "Uncertain",
            description:
               "Partial or uncertain answer — verify with sources or rephrase.",
            className: "text-red-600 bg-red-500/10 border-red-500/30",
         };
      default:
         return null;
   }
}
import {
   extractAnswerClaims,
   fallbackAnswerPhrase,
   type ClaimKind,
   type ExtractedClaim,
} from "@/lib/utils/extractClaims";

interface Props {
   message: ChatMessageType;
   /** Current document in scope, or undefined for global chat. */
   currentDocumentId?: string;
   /** Fired by source chip clicks AND anchor buttons. */
   onSourceClick?: (source: ChatSource) => void;
   /**
    * Executes a structured action. Parent wires this to the
    * `lib/chat/actionHandlers` registry. Separate from onSourceClick so
    * non-highlight actions (set_expiry, move, etc.) can be handled too.
    */
   onActionClick?: (action: ChatAction) => void;
   /** User clicks a suggested follow-up question — parent sends it. */
   onFollowupClick?: (question: string) => void;
}

function sourceLabel(source: ChatSource, currentDocumentId?: string): string {
   if (source.documentId && source.documentId !== currentDocumentId) {
      return source.documentTitle ?? "Other document";
   }
   if (typeof source.page === "number") return `Page ${source.page}`;
   if (source.snippet) {
      const preview = source.snippet.trim().split(/\s+/).slice(0, 4).join(" ");
      if (preview) return `"${preview}…"`;
   }
   if (typeof source.chunkIndex === "number")
      return `Source ${source.chunkIndex + 1}`;
   return "Source";
}

function claimIcon(kind: ClaimKind) {
   switch (kind) {
      case "currency":
         return <DollarSign size={11} />;
      case "date":
         return <Calendar size={11} />;
      case "percent":
         return <Percent size={11} />;
      case "quoted":
         return <Quote size={11} />;
      case "address":
         return <MapPin size={11} />;
      case "proper-noun":
         return <Tag size={11} />;
      default:
         return <Search size={11} />;
   }
}

/**
 * Map action.kind → icon. Unknown kinds get a generic wrench so users see
 * something consistent when the backend rolls out a new intent we haven't
 * styled yet.
 */
function actionIcon(kind: string) {
   if (kind === "highlight") return <Search size={12} />;
   if (kind.startsWith("set_") || kind === "set_metadata")
      return <CheckCircle2 size={12} />;
   if (kind.includes("folder")) return <Folder size={12} />;
   if (kind.includes("tag")) return <Tag size={12} />;
   if (kind.includes("share")) return <Share2 size={12} />;
   if (kind.includes("archive")) return <Archive size={12} />;
   return <Wrench size={12} />;
}

export const ChatMessage: FC<Props> = ({
   message,
   currentDocumentId,
   onSourceClick,
   onActionClick,
   onFollowupClick,
}) => {
   const isUser = message.role === "user";

   // ── Which source of highlight buttons do we render? Backend-authored
   //    anchors/actions take precedence; regex extraction is the fallback
   //    for legacy messages (or when stub AI provider returns plain text).
   const hasStructuredActions = message.actions.length > 0;
   const hasAnchors = message.anchors.length > 0;

   const regexClaims: ExtractedClaim[] = useMemo(() => {
      if (isUser) return [];
      if (hasStructuredActions || hasAnchors) return [];
      return extractAnswerClaims(message.content);
   }, [isUser, hasStructuredActions, hasAnchors, message.content]);

   const fallbackPhrase = useMemo(
      () => (isUser ? "" : fallbackAnswerPhrase(message.content)),
      [isUser, message.content]
   );

   const clickAnchor = (anchor: ChatAnchor) => {
      if (!onSourceClick || !currentDocumentId) return;
      onSourceClick({
         documentId: currentDocumentId,
         snippet: anchor.text,
         page: anchor.page,
         chunkIndex: anchor.chunkIndex,
      });
   };

   const clickRegexClaim = (claim: ExtractedClaim) => {
      if (!onSourceClick || !currentDocumentId) return;
      // Prefer a source whose snippet ACTUALLY contains the claim phrase —
      // sources[0] is "most relevant to the question", not "contains the
      // claim". For a fee query where 9 chunks discuss payment broadly, the
      // chunk containing "USD $75,000" might be at index 4 on page 1, not
      // index 0 on page 5.
      const needle = claim.phrase.toLowerCase();
      const matchingSource = message.sources.find((s) =>
         s.snippet?.toLowerCase().includes(needle)
      );
      const pageFromSources =
         matchingSource?.page ??
         message.sources.find((s) => typeof s.page === "number")?.page;
      onSourceClick({
         documentId: currentDocumentId,
         snippet: claim.phrase,
         page: pageFromSources,
      });
   };

   return (
      <div
         className={cn(
            "flex gap-3",
            isUser ? "flex-row-reverse" : "flex-row"
         )}
      >
         <div
            className='flex h-7 w-7 items-center justify-center rounded-full shrink-0'
            style={
               isUser
                  ? {
                       background: "var(--dc-accent)",
                       color: "#061f15",
                    }
                  : {
                       background: "var(--dc-accent-soft)",
                       color: "var(--dc-accent)",
                       border: "1px solid var(--dc-accent-border)",
                    }
            }
            aria-hidden='true'
         >
            {isUser ? <User size={14} strokeWidth={2} /> : <Bot size={14} strokeWidth={1.75} />}
         </div>
         <div
            className={cn(
               "flex flex-col gap-1.5 min-w-0",
               // User messages stay narrow (they're usually short questions),
               // assistant messages get more width so formatted lists/tables
               // don't wrap every other word in the 22–26 rem chat panel.
               isUser ? "items-end max-w-[85%]" : "items-start max-w-[95%]"
            )}
         >
            <div
               className={cn(
                  "rounded-lg px-3 py-2 text-sm break-words",
                  isUser && "whitespace-pre-wrap"
               )}
               style={
                  isUser
                     ? {
                          background: "var(--dc-accent)",
                          color: "#061f15",
                       }
                     : {
                          background: "var(--dc-surface-2)",
                          color: "var(--dc-text)",
                          border: "1px solid var(--dc-border)",
                       }
               }
            >
               {isUser ? (
                  message.content
               ) : (
                  // AI responses render as markdown so lists, emphasis, code,
                  // and tables come through. Tight typography tuned for a
                  // chat bubble — smaller headings, reduced list gaps, inline
                  // code background, zebra-free tables. Links open in a new
                  // tab because clicking them inside chat would blow away
                  // the conversation state.
                  <article className='prose-chat space-y-2 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:my-0 [&_li>p]:my-0 [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background/60 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-auto [&_pre]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:px-1.5 [&_th]:py-0.5 [&_th]:bg-background/40 [&_td]:border [&_td]:px-1.5 [&_td]:py-0.5 [&_hr]:my-2 [&_hr]:border-muted-foreground/30'>
                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                           a: ({ ...props }) => (
                              <a
                                 {...props}
                                 target='_blank'
                                 rel='noopener noreferrer'
                              />
                           ),
                        }}
                     >
                        {normalizeAssistantMarkdown(message.content)}
                     </ReactMarkdown>
                  </article>
               )}
            </div>

            {/* ───────────────────────────────────────────────────────
                Confidence badge — visible BEFORE actions so the user can
                calibrate trust before clicking a "Find in document" or
                "Set expiry" button. Skipped entirely for user messages and
                for unknown confidence values.
                ─────────────────────────────────────────────────────── */}
            {!isUser && (() => {
               const style = confidenceStyle(message.confidence);
               if (!style) return null;
               const { Icon, label, description, className } = style;
               return (
                  <div
                     className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                        className
                     )}
                     title={description}
                  >
                     <Icon size={10} />
                     <span>{label}</span>
                  </div>
               );
            })()}

            {/* ───────────────────────────────────────────────────────
                Primary actions — backend-authored commands. Rendered
                first because the AI picked them intentionally.
                ─────────────────────────────────────────────────────── */}
            {!isUser && hasStructuredActions && (
               <div className='flex flex-wrap gap-1.5'>
                  {message.actions.map((action, i) => (
                     <button
                        key={`action-${i}`}
                        type='button'
                        onClick={() => onActionClick?.(action)}
                        className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors max-w-[20rem] truncate'
                        style={{
                           background: "var(--dc-accent-soft)",
                           color: "var(--dc-accent)",
                           border: "1px solid var(--dc-accent-border)",
                        }}
                        title={action.label}
                     >
                        {actionIcon(action.kind)}
                        <span className='truncate'>{action.label}</span>
                     </button>
                  ))}
               </div>
            )}

            {/* ───────────────────────────────────────────────────────
                Anchor chips — the exact sentences the AI cited. Shown
                when we have anchors but no explicit "highlight" action
                pointing at them, so users can still click-to-find each
                supporting sentence individually.
                ─────────────────────────────────────────────────────── */}
            {!isUser && hasAnchors && currentDocumentId && (
               <div className='flex flex-wrap gap-1.5'>
                  {message.anchors.map((anchor, i) => {
                     const preview = anchor.text
                        .trim()
                        .split(/\s+/)
                        .slice(0, 5)
                        .join(" ");
                     return (
                        <button
                           key={`anchor-${i}`}
                           type='button'
                           onClick={() => clickAnchor(anchor)}
                           className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors max-w-[20rem] truncate'
                           style={{
                              background: "var(--dc-surface)",
                              border: "1px solid var(--dc-border)",
                              color: "var(--dc-text-muted)",
                           }}
                           onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--dc-surface-3)";
                              e.currentTarget.style.color = "var(--dc-text)";
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--dc-surface)";
                              e.currentTarget.style.color = "var(--dc-text-muted)";
                           }}
                           title={anchor.text}
                        >
                           <Search size={11} />
                           <span className='truncate'>
                              Find{" "}
                              <span className='font-medium'>
                                 &ldquo;{preview}&hellip;&rdquo;
                              </span>
                              {typeof anchor.page === "number" && (
                                 <span className='ml-1 opacity-70'>
                                    p.{anchor.page}
                                 </span>
                              )}
                           </span>
                        </button>
                     );
                  })}
               </div>
            )}

            {/* ───────────────────────────────────────────────────────
                Regex-claim fallback — only when neither actions nor
                anchors were provided. Legacy messages + stub provider.
                ─────────────────────────────────────────────────────── */}
            {!isUser && !hasStructuredActions && !hasAnchors && currentDocumentId && (
               <div className='flex flex-wrap gap-1.5'>
                  {regexClaims.map((claim, i) => (
                     <button
                        key={`claim-${i}`}
                        type='button'
                        onClick={() => clickRegexClaim(claim)}
                        className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors max-w-[16rem] truncate'
                        title={`Find "${claim.phrase}" in the document`}
                     >
                        {claimIcon(claim.kind)}
                        <span className='truncate'>
                           Find{" "}
                           <span className='font-medium'>
                              &ldquo;{claim.phrase}&rdquo;
                           </span>
                        </span>
                     </button>
                  ))}
                  {regexClaims.length === 0 && fallbackPhrase && (
                     <button
                        type='button'
                        onClick={() =>
                           clickRegexClaim({
                              phrase: fallbackPhrase,
                              kind: "quoted",
                           })
                        }
                        className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors max-w-[20rem] truncate'
                        title={`Find "${fallbackPhrase}" in the document`}
                     >
                        <Search size={11} />
                        <span className='truncate'>
                           Highlight answer in document
                        </span>
                     </button>
                  )}
               </div>
            )}

            {/* ───────────────────────────────────────────────────────
                Sources — collapsed supporting chunks. Useful for
                inspecting the AI's reasoning; off the primary path.
                ─────────────────────────────────────────────────────── */}
            {!isUser && message.sources.length > 0 && (
               <details className='group text-[11px] text-muted-foreground'>
                  <summary className='cursor-pointer select-none hover:text-foreground transition-colors inline-flex items-center gap-1'>
                     <FileText size={10} />
                     {message.sources.length} source
                     {message.sources.length === 1 ? "" : "s"}
                  </summary>
                  <div className='flex flex-wrap gap-1 mt-1.5'>
                     {message.sources.slice(0, 8).map((source, idx) => {
                        const label = sourceLabel(source, currentDocumentId);
                        const isCrossDoc =
                           !!source.documentId &&
                           source.documentId !== currentDocumentId;
                        const title =
                           typeof source.snippet === "string"
                              ? source.snippet
                              : undefined;
                        return (
                           <button
                              key={idx}
                              type='button'
                              title={title}
                              onClick={() => onSourceClick?.(source)}
                              className={cn(
                                 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors max-w-[14rem] truncate",
                                 onSourceClick && "cursor-pointer"
                              )}
                              style={{
                                 background: "var(--dc-surface)",
                                 border: "1px solid var(--dc-border)",
                                 color: "var(--dc-text-muted)",
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.background = "var(--dc-surface-3)";
                                 e.currentTarget.style.color = "var(--dc-text)";
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.background = "var(--dc-surface)";
                                 e.currentTarget.style.color = "var(--dc-text-muted)";
                              }}
                           >
                              {isCrossDoc ? (
                                 <ExternalLink
                                    size={10}
                                    className='shrink-0'
                                    aria-hidden='true'
                                 />
                              ) : (
                                 <FileText
                                    size={10}
                                    className='shrink-0'
                                    aria-hidden='true'
                                 />
                              )}
                              <span className='truncate'>{label}</span>
                           </button>
                        );
                     })}
                  </div>
               </details>
            )}

            {/* ───────────────────────────────────────────────────────
                Processing steps — collapsible "How this was generated"
                section showing each pipeline step with duration.
                Only rendered when the backend provides processing_steps.
                ─────────────────────────────────────────────────────── */}
            {!isUser && message.processingSteps.length > 0 && (
               <details className='group text-[11px] text-muted-foreground'>
                  <summary className='cursor-pointer select-none hover:text-foreground transition-colors inline-flex items-center gap-1'>
                     <Zap size={10} />
                     How this was generated
                  </summary>
                  <div className='mt-1.5 space-y-1 pl-2 border-l-2 border-muted'>
                     {message.processingSteps.map((step: ProcessingStep, i: number) => (
                        <div key={i} className='flex items-baseline gap-2'>
                           <span className='truncate flex-1'>{step.message}</span>
                           {step.durationMs > 0 && (
                              <span className='shrink-0 opacity-60 tabular-nums'>
                                 {step.durationMs}ms
                              </span>
                           )}
                        </div>
                     ))}
                  </div>
               </details>
            )}

            {/* ───────────────────────────────────────────────────────
                Follow-up suggestions — rendered as tap-able chips that
                send the question through the existing chat flow.
                ─────────────────────────────────────────────────────── */}
            {!isUser && message.followups.length > 0 && onFollowupClick && (
               <div className='mt-1 space-y-1.5'>
                  <p
                     className='text-[10px] uppercase tracking-[0.06em] font-semibold'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     Try next
                  </p>
                  <div className='flex flex-wrap gap-1.5'>
                     {message.followups.map((q, i) => (
                        <button
                           key={`fu-${i}`}
                           type='button'
                           onClick={() => onFollowupClick(q)}
                           className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors max-w-[22rem] truncate'
                           style={{
                              background: "var(--dc-surface)",
                              border: "1px solid var(--dc-border)",
                              color: "var(--dc-text)",
                           }}
                           onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--dc-surface-3)";
                              e.currentTarget.style.borderColor = "var(--dc-border-strong)";
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--dc-surface)";
                              e.currentTarget.style.borderColor = "var(--dc-border)";
                           }}
                           title={q}
                        >
                           <Send size={10} className='shrink-0 opacity-60' />
                           <span className='truncate'>{q}</span>
                           <ArrowRight
                              size={10}
                              className='shrink-0 opacity-60'
                           />
                        </button>
                     ))}
                  </div>
               </div>
            )}

            <span
               className='text-[10px] px-1'
               style={{ color: "var(--dc-text-faint)" }}
            >
               {formatRelativeTime(message.createdAt)}
            </span>
         </div>
      </div>
   );
};

export const ChatTypingIndicator: FC<{ stepMessage?: string }> = ({ stepMessage }) => (
   <div className='flex gap-3'>
      <div
         className='flex h-7 w-7 items-center justify-center rounded-full shrink-0'
         style={{
            background: "var(--dc-accent-soft)",
            color: "var(--dc-accent)",
            border: "1px solid var(--dc-accent-border)",
         }}
      >
         <Bot size={14} strokeWidth={1.75} />
      </div>
      <div
         className='rounded-lg px-3 py-2 flex items-center gap-2 min-w-0'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
         }}
      >
         <span className='inline-flex gap-1 shrink-0' aria-label='Assistant is thinking'>
            <span
               className='h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.3s]'
               style={{ background: "var(--dc-accent)" }}
            />
            <span
               className='h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.15s]'
               style={{ background: "var(--dc-accent)" }}
            />
            <span
               className='h-1.5 w-1.5 rounded-full animate-bounce'
               style={{ background: "var(--dc-accent)" }}
            />
         </span>
         {stepMessage && (
            <span
               className='text-[12px] italic truncate'
               style={{ color: "var(--dc-text-muted)" }}
            >
               {stepMessage}
            </span>
         )}
      </div>
   </div>
);
