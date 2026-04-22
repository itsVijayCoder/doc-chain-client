"use client";

import { FC, FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { Download, FileCheck2, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   shareLinkService,
   type ShareLinkAccess,
} from "@/lib/services/shareLinkService";
import type { ApiError } from "@/lib/types";

// Public page — not wrapped in AuthGuard. External users click a share URL
// and land here. They don't have a user account (or we don't assume they
// do); the share link's password is the only credential.

const API_URL =
   process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

async function fetchWithShareToken(
   path: string,
   shareAccessToken: string
): Promise<Blob> {
   const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${shareAccessToken}` },
   });
   if (!res.ok) {
      throw new Error(`Download failed (${res.status})`);
   }
   return res.blob();
}

const SharePublicPage: FC = () => {
   const params = useParams<{ token: string }>();
   const token = params?.token ?? "";

   const [password, setPassword] = useState("");
   const [access, setAccess] = useState<ShareLinkAccess | null>(null);
   const [verifying, setVerifying] = useState(false);
   const [downloading, setDownloading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleVerify = async (e: FormEvent) => {
      e.preventDefault();
      if (!token || password.length === 0) return;
      setVerifying(true);
      setError(null);
      try {
         const result = await shareLinkService.verify(token, password);
         setAccess(result);
      } catch (err) {
         const apiErr = err as ApiError;
         const code = apiErr?.code;
         if (code === "SHARE_LINK_EXPIRED") {
            setError("This share link has expired.");
         } else if (code === "SHARE_LINK_MAX_VIEWS") {
            setError("This link has reached its view limit.");
         } else if (code === "SHARE_LINK_INVALID_PASSWORD") {
            setError("Incorrect password.");
         } else {
            setError(
               apiErr?.message ??
                  "Could not verify this link. Check the password and try again."
            );
         }
      } finally {
         setVerifying(false);
      }
   };

   const handleDownload = async () => {
      if (!access) return;
      setDownloading(true);
      try {
         const blob = await fetchWithShareToken(
            `/documents/${access.documentId}/download`,
            access.accessToken
         );
         const blobUrl = URL.createObjectURL(blob);
         const anchor = document.createElement("a");
         anchor.href = blobUrl;
         anchor.download = access.documentTitle;
         document.body.appendChild(anchor);
         anchor.click();
         anchor.remove();
         setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Download failed. Try again."
         );
      } finally {
         setDownloading(false);
      }
   };

   return (
      <div className='min-h-screen flex items-center justify-center bg-muted/30 p-4'>
         <div className='w-full max-w-md bg-background border rounded-xl shadow-sm p-6 space-y-6'>
            {!access ? (
               <>
                  <div className='space-y-2'>
                     <div className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary'>
                        <Lock size={22} />
                     </div>
                     <h1 className='text-xl font-semibold'>
                        Password-protected document
                     </h1>
                     <p className='text-sm text-muted-foreground'>
                        Enter the password you received with this link to
                        continue.
                     </p>
                  </div>

                  <form onSubmit={handleVerify} className='space-y-4'>
                     <div>
                        <Label htmlFor='share-password' className='text-xs'>
                           Password
                        </Label>
                        <Input
                           id='share-password'
                           type='password'
                           value={password}
                           onChange={(e) => {
                              setPassword(e.target.value);
                              if (error) setError(null);
                           }}
                           autoFocus
                           autoComplete='off'
                           disabled={verifying}
                           className='mt-1'
                        />
                     </div>

                     {error && (
                        <div className='flex items-start gap-2 text-sm text-(--error) bg-(--error)/5 border border-(--error)/30 rounded-md p-3'>
                           <ShieldAlert
                              size={16}
                              className='mt-0.5 shrink-0'
                           />
                           <span>{error}</span>
                        </div>
                     )}

                     <Button
                        type='submit'
                        disabled={verifying || !password}
                        className='w-full'
                     >
                        {verifying ? "Verifying…" : "Unlock"}
                     </Button>
                  </form>
               </>
            ) : (
               <>
                  <div className='space-y-2'>
                     <div className='inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-600/10 text-emerald-600'>
                        <FileCheck2 size={22} />
                     </div>
                     <h1 className='text-xl font-semibold break-words'>
                        {access.documentTitle}
                     </h1>
                     <p className='text-sm text-muted-foreground'>
                        You have access to this document. Download to view.
                     </p>
                  </div>

                  {error && (
                     <div className='flex items-start gap-2 text-sm text-(--error) bg-(--error)/5 border border-(--error)/30 rounded-md p-3'>
                        <ShieldAlert
                           size={16}
                           className='mt-0.5 shrink-0'
                        />
                        <span>{error}</span>
                     </div>
                  )}

                  <Button
                     type='button'
                     onClick={handleDownload}
                     disabled={downloading}
                     className='w-full'
                  >
                     <Download size={16} className='mr-2' />
                     {downloading ? "Downloading…" : "Download"}
                  </Button>

                  <p className='text-[11px] text-muted-foreground text-center'>
                     This access token is short-lived. If the download fails,
                     reload this page and re-enter the password.
                  </p>
               </>
            )}
         </div>
      </div>
   );
};

export default SharePublicPage;
