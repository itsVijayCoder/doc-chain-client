"use client";

import { FC, useState, useEffect } from "react";
import { User } from "@/lib/types/user";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/format";

interface UserSearchComboboxProps {
   users: User[];
   selectedUsers: User[];
   onSelectUser: (user: User) => void;
   onDeselectUser: (user: User) => void;
   placeholder?: string;
   isLoading?: boolean;
}

/**
 * UserSearchCombobox Component
 * Searchable user selection with avatar and role display
 * Follows Single Responsibility Principle - only handles user search/selection
 */
export const UserSearchCombobox: FC<UserSearchComboboxProps> = ({
   users,
   selectedUsers,
   onSelectUser,
   onDeselectUser,
   placeholder = "Search users...",
   isLoading = false,
}) => {
   const [search, setSearch] = useState("");
   const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

   useEffect(() => {
      if (!search.trim()) {
         setFilteredUsers(users);
         return;
      }

      const searchLower = search.toLowerCase();
      const filtered = users.filter(
         (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
      );
      setFilteredUsers(filtered);
   }, [search, users]);

   const isSelected = (user: User) => {
      return selectedUsers.some((u) => u.id === user.id);
   };

   const handleSelect = (user: User) => {
      if (isSelected(user)) {
         onDeselectUser(user);
      } else {
         onSelectUser(user);
      }
   };

   return (
      <div className='space-y-4'>
         {/* Selected Users */}
         {selectedUsers.length > 0 && (
            <div className='flex flex-wrap gap-2'>
               {selectedUsers.map((user) => (
                  <Badge
                     key={user.id}
                     variant='secondary'
                     className='gap-2 pr-1 cursor-pointer hover:bg-muted'
                     onClick={() => onDeselectUser(user)}
                  >
                     <Avatar className='h-5 w-5'>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className='text-xs'>
                           {getInitials(user.name)}
                        </AvatarFallback>
                     </Avatar>
                     <span>{user.name}</span>
                     <button
                        className='ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5'
                        onClick={(e) => {
                           e.stopPropagation();
                           onDeselectUser(user);
                        }}
                     >
                        <Check size={12} />
                     </button>
                  </Badge>
               ))}
            </div>
         )}

         {/* User Search */}
         <Command className='border rounded-lg'>
            <div className='flex items-center border-b px-3'>
               <Search size={16} className='mr-2 text-muted-foreground' />
               <CommandInput
                  placeholder={placeholder}
                  value={search}
                  onValueChange={setSearch}
                  className='border-0 focus:ring-0'
               />
            </div>
            <CommandList>
               {isLoading ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                     Loading users...
                  </div>
               ) : filteredUsers.length === 0 ? (
                  <CommandEmpty>No users found</CommandEmpty>
               ) : (
                  <CommandGroup>
                     {filteredUsers.map((user) => {
                        const selected = isSelected(user);
                        return (
                           <CommandItem
                              key={user.id}
                              onSelect={() => handleSelect(user)}
                              className='flex items-center gap-3 cursor-pointer'
                           >
                              <div
                                 className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    selected
                                       ? "bg-primary text-primary-foreground"
                                       : "opacity-50"
                                 )}
                              >
                                 {selected && <Check size={12} />}
                              </div>
                              <Avatar className='h-8 w-8'>
                                 <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                 />
                                 <AvatarFallback className='text-xs'>
                                    {getInitials(user.name)}
                                 </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                 <p className='font-medium truncate'>
                                    {user.name}
                                 </p>
                                 <p className='text-xs text-muted-foreground truncate'>
                                    {user.email}
                                 </p>
                              </div>
                              <Badge variant='outline' className='text-xs'>
                                 {user.role}
                              </Badge>
                           </CommandItem>
                        );
                     })}
                  </CommandGroup>
               )}
            </CommandList>
         </Command>
      </div>
   );
};
