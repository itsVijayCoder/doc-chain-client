"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Link2, RefreshCw, X } from "lucide-react";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";
import { PermissionLevel } from "@/components/documents/sharing/PermissionSelector";
import { ExpirySettings } from "@/components/documents/sharing/ExpirySettings";

interface ShareLinkGeneratorProps {
   documentId: string;
   existingLink?: {
      id: string;
      url: string;
      permission: PermissionLevel;
      expiresAt?: Date;
      allowDownload: boolean;
      requirePassword: boolean;
   };
   onGenerate: (settings: ShareLinkSettings) => Promise<string>;
   onRevoke: (linkId: string) => Promise<void>;
   isLoading?: boolean;
}

export interface ShareLinkSettings {
   permission: PermissionLevel;
   expiresAt?: Date;
   allowDownload: boolean;
   requirePassword: boolean;
   password?: string;
   blockchainAudit?: boolean;
}

/**
 * ShareLinkGenerator Component
 * Generates and manages shareable links with expiry and password options
 * Follows Single Responsibility Principle - handles link generation UI
 */
export const ShareLinkGenerator: FC<ShareLinkGeneratorProps> = ({
   documentId,
   existingLink,
   onGenerate,
   onRevoke,
   isLoading = false,
}) => {
   const toast = useToast();
   const [copied, setCopied] = useState(false);
   const [generatedLink, setGeneratedLink] = useState<string | null>(
      existingLink?.url || null
   );

   const [settings, setSettings] = useState<ShareLinkSettings>({
      permission: existingLink?.permission || "view",
      expiresAt: existingLink?.expiresAt,
      allowDownload: existingLink?.allowDownload ?? true,
      requirePassword: existingLink?.requirePassword ?? false,
      password: "",
   });

   const handleCopyLink = async () => {
      if (!generatedLink) return;

      try {
         await navigator.clipboard.writeText(generatedLink);
         setCopied(true);
         toast.success("Link copied to clipboard");
         setTimeout(() => setCopied(false), 2000);
      } catch (error) {
         toast.error("Failed to copy link");
      }
   };

   const handleGenerate = async () => {
      try {
         const link = await onGenerate(settings);
         setGeneratedLink(link);
         toast.success("Share link generated");
      } catch (error: any) {
         toast.error("Failed to generate link", error.message);
      }
   };

   const handleRevoke = async () => {
      if (!existingLink) return;

      if (
         confirm(
            "Are you sure you want to revoke this link? Anyone with the link will lose access."
         )
      ) {
         try {
            await onRevoke(existingLink.id);
            setGeneratedLink(null);
            toast.success("Share link revoked");
         } catch (error: any) {
            toast.error("Failed to revoke link", error.message);
         }
      }
   };

   return (
      <div className='space-y-6'>
         {/* Generated Link Display */}
         {generatedLink && (
            <div className='space-y-3 p-4 border rounded-lg bg-muted/50'>
               <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Share Link</Label>
                  <Badge variant='default' className='gap-1'>
                     <Link2 size={12} />
                     Active
                  </Badge>
               </div>

               <div className='flex gap-2'>
                  <Input
                     value={generatedLink}
                     readOnly
                     className='font-mono text-sm'
                  />
                  <Button
                     variant='outline'
                     size='icon'
                     onClick={handleCopyLink}
                     className='shrink-0'
                  >
                     {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
               </div>

               {existingLink?.expiresAt && (
                  <p className='text-xs text-muted-foreground'>
                     Expires:{" "}
                     {new Date(existingLink.expiresAt).toLocaleString()}
                  </p>
               )}

               <div className='flex gap-2'>
                  <Button
                     variant='outline'
                     size='sm'
                     onClick={handleRevoke}
                     disabled={isLoading}
                     className='gap-2'
                  >
                     <X size={14} />
                     Revoke Link
                  </Button>
                  <Button
                     variant='outline'
                     size='sm'
                     onClick={handleGenerate}
                     disabled={isLoading}
                     className='gap-2'
                  >
                     <RefreshCw size={14} />
                     Regenerate
                  </Button>
               </div>
            </div>
         )}

         {/* Link Settings */}
         {!generatedLink && (
            <div className='space-y-4'>
               <div>
                  <Label>Link Permissions</Label>
                  <div className='flex gap-2 mt-2'>
                     <Button
                        variant={
                           settings.permission === "view"
                              ? "default"
                              : "outline"
                        }
                        size='sm'
                        onClick={() =>
                           setSettings({ ...settings, permission: "view" })
                        }
                     >
                        View Only
                     </Button>
                     <Button
                        variant={
                           settings.permission === "edit"
                              ? "default"
                              : "outline"
                        }
                        size='sm'
                        onClick={() =>
                           setSettings({ ...settings, permission: "edit" })
                        }
                     >
                        Can Edit
                     </Button>
                  </div>
               </div>

               <ExpirySettings
                  value={settings.expiresAt}
                  onChange={(expiresAt) =>
                     setSettings({ ...settings, expiresAt })
                  }
               />

               <div className='flex items-center justify-between p-3 border rounded-lg'>
                  <div>
                     <Label className='text-sm font-medium'>
                        Allow Download
                     </Label>
                     <p className='text-xs text-muted-foreground mt-1'>
                        Recipients can download the document
                     </p>
                  </div>
                  <Switch
                     checked={settings.allowDownload}
                     onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowDownload: checked })
                     }
                  />
               </div>

               <div className='flex items-center justify-between p-3 border rounded-lg'>
                  <div>
                     <Label className='text-sm font-medium'>
                        Password Protection
                     </Label>
                     <p className='text-xs text-muted-foreground mt-1'>
                        Require a password to access
                     </p>
                  </div>
                  <Switch
                     checked={settings.requirePassword}
                     onCheckedChange={(checked) =>
                        setSettings({ ...settings, requirePassword: checked })
                     }
                  />
               </div>

               {settings.requirePassword && (
                  <div>
                     <Label htmlFor='password'>Password</Label>
                     <Input
                        id='password'
                        type='password'
                        value={settings.password}
                        onChange={(e) =>
                           setSettings({
                              ...settings,
                              password: e.target.value,
                           })
                        }
                        placeholder='Enter password'
                        className='mt-2'
                     />
                  </div>
               )}

               <Button
                  onClick={handleGenerate}
                  disabled={
                     isLoading ||
                     (settings.requirePassword && !settings.password)
                  }
                  className='w-full gap-2'
               >
                  <Link2 size={16} />
                  Generate Share Link
               </Button>
            </div>
         )}
      </div>
   );
};
