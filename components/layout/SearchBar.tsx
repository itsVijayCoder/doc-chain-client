"use client";

import { FC, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKeyboard } from "@/lib/hooks/useKeyboard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
   className?: string;
   placeholder?: string;
}

export const SearchBar: FC<SearchBarProps> = ({
   className,
   placeholder = "Search documents...",
}) => {
   const router = useRouter();
   const [query, setQuery] = useState("");
   const [isFocused, setIsFocused] = useState(false);
   const debouncedQuery = useDebounce(query, 300);

   const handleSearch = useCallback(() => {
      if (debouncedQuery.trim()) {
         router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      }
   }, [debouncedQuery, router]);

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
         handleSearch();
      }
      if (e.key === "Escape") {
         setQuery("");
         (e.target as HTMLInputElement).blur();
      }
   };

   // Cmd+K to focus search
   useKeyboard({
      "cmd+k": (e) => {
         e.preventDefault();
         const input = document.getElementById(
            "global-search"
         ) as HTMLInputElement;
         if (input) {
            input.focus();
         }
      },
      "ctrl+k": (e) => {
         e.preventDefault();
         const input = document.getElementById(
            "global-search"
         ) as HTMLInputElement;
         if (input) {
            input.focus();
         }
      },
   });

   return (
      <div className={cn("relative", className)}>
         <Search
            size={18}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'
         />
         <Input
            id='global-search'
            type='search'
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn("pl-10 pr-20", isFocused && "ring-2 ring-primary/20")}
         />
         <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none'>
            <kbd className='px-1.5 py-0.5 rounded bg-muted font-mono'>⌘</kbd>
            <kbd className='px-1.5 py-0.5 rounded bg-muted font-mono'>K</kbd>
         </div>
      </div>
   );
};
