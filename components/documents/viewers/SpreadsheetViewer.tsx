"use client";

import { FC, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { fetchAuthBlob } from "@/lib/services/authFetch";
import { cn } from "@/lib/utils";

interface Props {
   src: string;
}

interface ParsedWorkbook {
   sheetNames: string[];
   sheetHtml: Record<string, string>;
}

/**
 * Spreadsheet preview via SheetJS. Handles XLSX, XLS, CSV — SheetJS sniffs
 * the format from the bytes. Renders the first sheet by default; a tab
 * strip is shown when the workbook contains multiple sheets.
 *
 * `sheet_to_html` emits SheetJS's own serialized markup — no scripts, no
 * inline handlers — so `dangerouslySetInnerHTML` is acceptable here.
 */
const SpreadsheetViewer: FC<Props> = ({ src }) => {
   const query = useQuery<ParsedWorkbook>({
      queryKey: ["viewer", "spreadsheet", src],
      queryFn: async () => {
         const blob = await fetchAuthBlob(src);
         const buf = await blob.arrayBuffer();
         const wb = XLSX.read(buf, { type: "array" });
         const sheetNames = wb.SheetNames;
         const sheetHtml: Record<string, string> = {};
         for (const name of sheetNames) {
            sheetHtml[name] = XLSX.utils.sheet_to_html(wb.Sheets[name], {
               editable: false,
               header: "",
               footer: "",
            });
         }
         return { sheetNames, sheetHtml };
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
   });

   const [activeSheet, setActiveSheet] = useState<string | null>(null);
   const defaultSheet = query.data?.sheetNames[0] ?? null;
   const currentSheet = activeSheet ?? defaultSheet;

   const activeHtml = useMemo(() => {
      if (!query.data || !currentSheet) return "";
      return query.data.sheetHtml[currentSheet] ?? "";
   }, [query.data, currentSheet]);

   if (query.isLoading) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            Loading spreadsheet…
         </div>
      );
   }

   if (query.isError || !query.data) {
      return (
         <div className='text-sm text-muted-foreground p-12 text-center'>
            {query.error instanceof Error
               ? query.error.message
               : "Failed to load spreadsheet."}
         </div>
      );
   }

   return (
      <div className='flex flex-col max-h-[75vh]'>
         {query.data.sheetNames.length > 1 && (
            <div className='flex items-center gap-1 border-b px-2 overflow-x-auto bg-background/80'>
               {query.data.sheetNames.map((name) => (
                  <button
                     key={name}
                     type='button'
                     onClick={() => setActiveSheet(name)}
                     className={cn(
                        "px-3 py-2 text-xs whitespace-nowrap border-b-2 -mb-px transition-colors",
                        currentSheet === name
                           ? "border-primary font-medium"
                           : "border-transparent text-muted-foreground hover:text-foreground"
                     )}
                  >
                     {name}
                  </button>
               ))}
            </div>
         )}
         <div
            className='overflow-auto p-4 text-sm [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top'
            dangerouslySetInnerHTML={{ __html: activeHtml }}
         />
      </div>
   );
};

export default SpreadsheetViewer;
