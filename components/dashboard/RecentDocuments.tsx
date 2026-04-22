"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { documentService } from "@/lib/services/documentService";
import { formatRelativeTime } from "@/lib/utils/format";
import { FileText, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function FileIcon({ mimeType }: { mimeType?: string }) {
   const ext = mimeType?.split("/")[1]?.toUpperCase().slice(0, 3) ?? "DOC";
   const color =
      mimeType?.includes("pdf") ? "bg-red-500/10 text-red-600" :
      mimeType?.includes("word") || mimeType?.includes("doc") ? "bg-blue-500/10 text-blue-600" :
      mimeType?.includes("sheet") || mimeType?.includes("excel") ? "bg-green-500/10 text-green-600" :
      mimeType?.includes("image") ? "bg-purple-500/10 text-purple-600" :
      "bg-muted text-muted-foreground";

   return (
      <div className={cn("w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0", color)}>
         <FileText size={14} />
         <span className="text-[8px] font-bold leading-none mt-0.5">{ext}</span>
      </div>
   );
}

export function RecentDocuments() {
   const router = useRouter();

   const { data, isLoading } = useQuery({
      queryKey: ["documents", "list", { page: 1, pageSize: 5, sortBy: "updated_at", sortDir: "desc" }],
      queryFn: () => documentService.list({ page: 1, pageSize: 5, sortBy: "updated_at", sortDir: "desc" }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
   });

   const docs = data?.documents ?? [];

   return (
      <Card className="p-6">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
            <Link
               href="/documents"
               className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
               View all <ChevronRight size={14} />
            </Link>
         </div>

         {isLoading ? (
            <div className="space-y-3">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
               ))}
            </div>
         ) : docs.length === 0 ? (
            <div className="py-10 text-center">
               <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
               <p className="text-sm text-muted-foreground">No documents yet</p>
               <button
                  onClick={() => router.push("/documents?action=upload")}
                  className="text-sm text-primary hover:text-primary/80 mt-1 transition-colors"
               >
                  Upload your first document
               </button>
            </div>
         ) : (
            <div className="divide-y">
               {docs.map((doc) => (
                  <Link
                     key={doc.id}
                     href={`/documents/${doc.id}`}
                     className="flex items-center gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                     <FileIcon mimeType={doc.mimeType} />
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                           {formatRelativeTime(doc.updatedAt?.toISOString() ?? doc.createdAt?.toISOString() ?? "")}
                        </p>
                     </div>
                     {doc.blockchainVerified && (
                        <Shield size={14} className="text-blockchain shrink-0" />
                     )}
                  </Link>
               ))}
            </div>
         )}
      </Card>
   );
}
