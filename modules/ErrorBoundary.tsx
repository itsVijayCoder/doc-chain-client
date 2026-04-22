"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
   moduleId: string;
   children: ReactNode;
}

interface State {
   hasError: boolean;
   error: Error | null;
}

// Per-module error boundary. Wraps each module's catch-all page render AND each
// extension-point render so one module's crash never takes down the shell or
// a sibling module.
//
// ChunkLoadError gets a page reload — after a deployment, in-browser code
// holding a stale chunk manifest can fail to fetch now-renamed bundles.
// A re-render wouldn't fix it; a full reload pulls the new manifest.
export class ModuleErrorBoundary extends Component<Props, State> {
   state: State = { hasError: false, error: null };

   static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   componentDidCatch(error: Error, info: ErrorInfo) {
      if (error.name === "ChunkLoadError") {
         window.location.reload();
         return;
      }
      console.error(`[Module:${this.props.moduleId}] Render error:`, error, info);
   }

   render() {
      if (this.state.hasError) {
         return (
            <div
               className='p-6 rounded-xl'
               style={{
                  background: "var(--dc-danger-soft)",
                  border: "1px solid var(--dc-danger-border)",
               }}
            >
               <h3
                  className='text-[14px] font-semibold'
                  style={{ color: "var(--dc-danger)" }}
               >
                  Module &quot;{this.props.moduleId}&quot; encountered an error
               </h3>
               <p
                  className='text-[12.5px] mt-1'
                  style={{ color: "var(--dc-text-muted)" }}
               >
                  {this.state.error?.message ?? "Unknown error"}
               </p>
               <button
                  type='button'
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className='mt-3 text-[12.5px] underline'
                  style={{ color: "var(--dc-danger)" }}
               >
                  Retry
               </button>
            </div>
         );
      }
      return this.props.children;
   }
}
