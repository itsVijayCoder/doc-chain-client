"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
   ShieldCheck,
   ShieldOff,
   RefreshCw,
   Copy,
   CheckCircle2,
   AlertTriangle,
} from "lucide-react";
import { twoFaService } from "@/lib/services/twoFaService";
import { AUTH_QUERY_KEY } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

const STATUS_KEY = ["2fa", "status"] as const;

type SetupStep = "idle" | "password_prompt" | "qr" | "verify";
type DisableStep = "idle" | "password_prompt";
type RegenerateStep = "idle" | "password_prompt";

function CodeGrid({ codes }: { codes: string[] }) {
   const toast = useToast();
   const copyAll = () => {
      navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Copied", "Backup codes copied to clipboard");
   };
   return (
      <div className='space-y-2'>
         <div className='grid grid-cols-2 gap-2'>
            {codes.map((code) => (
               <code
                  key={code}
                  className='block px-3 py-2 rounded border bg-muted font-mono text-sm text-center tracking-widest'
               >
                  {code}
               </code>
            ))}
         </div>
         <Button variant='outline' size='sm' className='w-full gap-2' onClick={copyAll}>
            <Copy className='w-3.5 h-3.5' /> Copy all codes
         </Button>
      </div>
   );
}

export function TwoFactorAuth() {
   const queryClient = useQueryClient();
   const toast = useToast();

   // ─── Setup flow ────────────────────────────────────────────────────────
   const [setupStep, setSetupStep] = useState<SetupStep>("idle");
   const [setupPassword, setSetupPassword] = useState("");
   const [setupPasswordErr, setSetupPasswordErr] = useState<string | null>(null);
   const [qrUri, setQrUri] = useState<string | null>(null);
   const [backupCodes, setBackupCodes] = useState<string[]>([]);
   const [savedCodes, setSavedCodes] = useState(false);
   const [verifyCode, setVerifyCode] = useState("");
   const [verifyErr, setVerifyErr] = useState<string | null>(null);

   // ─── Disable flow ──────────────────────────────────────────────────────
   const [disableStep, setDisableStep] = useState<DisableStep>("idle");
   const [disablePassword, setDisablePassword] = useState("");
   const [disablePasswordErr, setDisablePasswordErr] = useState<string | null>(null);

   // ─── Regenerate flow ───────────────────────────────────────────────────
   const [regenStep, setRegenStep] = useState<RegenerateStep>("idle");
   const [regenPassword, setRegenPassword] = useState("");
   const [regenPasswordErr, setRegenPasswordErr] = useState<string | null>(null);
   const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

   // ─── Data ──────────────────────────────────────────────────────────────
   const { data: status, isLoading } = useQuery({
      queryKey: STATUS_KEY,
      queryFn: twoFaService.getStatus,
      staleTime: 60_000,
   });

   // ─── Mutations ─────────────────────────────────────────────────────────
   const setupMutation = useMutation({
      mutationFn: (password: string) => twoFaService.setup(password),
      onSuccess: (data) => {
         setQrUri(data.qr_uri);
         setBackupCodes(data.backup_codes);
         setSetupStep("qr");
         setSetupPassword("");
      },
      onError: (err: any) => {
         setSetupPasswordErr(err?.details?.[0] ?? err?.message ?? "Incorrect password");
      },
   });

   const verifyMutation = useMutation({
      mutationFn: (code: string) => twoFaService.verify(code),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: STATUS_KEY });
         queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
         setSetupStep("idle");
         setQrUri(null);
         setBackupCodes([]);
         setSavedCodes(false);
         setVerifyCode("");
         toast.success("2FA enabled", "Your account is now protected with two-factor authentication");
      },
      onError: (err: any) => {
         setVerifyErr(err?.details?.[0] ?? err?.message ?? "Invalid code — try again");
      },
   });

   const disableMutation = useMutation({
      mutationFn: (password: string) => twoFaService.disable(password),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: STATUS_KEY });
         queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
         setDisableStep("idle");
         setDisablePassword("");
         toast.success("2FA disabled", "Two-factor authentication has been turned off");
      },
      onError: (err: any) => {
         setDisablePasswordErr(err?.details?.[0] ?? err?.message ?? "Incorrect password");
      },
   });

   const regenMutation = useMutation({
      mutationFn: (password: string) => twoFaService.regenerateBackupCodes(password),
      onSuccess: (data) => {
         queryClient.invalidateQueries({ queryKey: STATUS_KEY });
         setNewBackupCodes(data.backup_codes);
         setRegenPassword("");
      },
      onError: (err: any) => {
         setRegenPasswordErr(err?.details?.[0] ?? err?.message ?? "Incorrect password");
      },
   });

   // ─── Handlers ──────────────────────────────────────────────────────────
   const startSetup = () => {
      setSetupPassword("");
      setSetupPasswordErr(null);
      setSetupStep("password_prompt");
   };

   const confirmSetupPassword = () => {
      if (!setupPassword) { setSetupPasswordErr("Password is required"); return; }
      setSetupPasswordErr(null);
      setupMutation.mutate(setupPassword);
   };

   const submitVerify = () => {
      if (verifyCode.length !== 6) { setVerifyErr("Enter the 6-digit code from your app"); return; }
      setVerifyErr(null);
      verifyMutation.mutate(verifyCode);
   };

   const confirmDisable = () => {
      if (!disablePassword) { setDisablePasswordErr("Password is required"); return; }
      setDisablePasswordErr(null);
      disableMutation.mutate(disablePassword);
   };

   const confirmRegen = () => {
      if (!regenPassword) { setRegenPasswordErr("Password is required"); return; }
      setRegenPasswordErr(null);
      regenMutation.mutate(regenPassword);
   };

   if (isLoading) {
      return <div className='h-24 rounded-lg border bg-card animate-pulse' />;
   }

   const enabled = status?.enabled ?? false;

   return (
      <>
         <Card>
            <CardHeader className='pb-3'>
               <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                     <ShieldCheck className='w-5 h-5 text-primary' />
                     <CardTitle className='text-base'>Two-Factor Authentication</CardTitle>
                  </div>
                  <Badge
                     variant='outline'
                     className={cn(
                        enabled
                           ? "text-(--success) border-(--success)/40 bg-(--success)/10"
                           : "text-muted-foreground"
                     )}
                  >
                     {enabled ? "Enabled" : "Not enabled"}
                  </Badge>
               </div>
               <CardDescription>
                  Require a time-based code on every login. Protects your account even if your password is compromised.
               </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
               {enabled ? (
                  <>
                     <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                           Active since{" "}
                           {status?.verified_at
                              ? new Date(status.verified_at).toLocaleDateString()
                              : "—"}
                        </span>
                        <span className='text-muted-foreground'>
                           {status?.backup_codes_remaining ?? 0} backup{" "}
                           {status?.backup_codes_remaining === 1 ? "code" : "codes"} remaining
                        </span>
                     </div>

                     <div className='flex gap-2 flex-wrap'>
                        <Button
                           variant='outline'
                           size='sm'
                           className='gap-2'
                           onClick={() => {
                              setRegenPassword("");
                              setRegenPasswordErr(null);
                              setNewBackupCodes([]);
                              setRegenStep("password_prompt");
                           }}
                        >
                           <RefreshCw className='w-3.5 h-3.5' />
                           Regenerate backup codes
                        </Button>
                        <Button
                           variant='outline'
                           size='sm'
                           className='gap-2 text-(--error) border-(--error)/40 hover:bg-(--error)/10'
                           onClick={() => {
                              setDisablePassword("");
                              setDisablePasswordErr(null);
                              setDisableStep("password_prompt");
                           }}
                        >
                           <ShieldOff className='w-3.5 h-3.5' />
                           Disable 2FA
                        </Button>
                     </div>
                  </>
               ) : (
                  <div className='flex items-start gap-3 p-4 rounded-lg border bg-muted/30'>
                     <AlertTriangle className='w-5 h-5 text-(--warning) mt-0.5 shrink-0' />
                     <div className='space-y-2'>
                        <p className='text-sm text-muted-foreground'>
                           Your account is protected by password only. Enable 2FA to add a second layer of security.
                        </p>
                        <Button size='sm' onClick={startSetup}>
                           Enable 2FA
                        </Button>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>

         {/* ── Setup: Password confirm ── */}
         <Dialog
            open={setupStep === "password_prompt"}
            onOpenChange={(o) => { if (!o) setSetupStep("idle"); }}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Confirm your password</DialogTitle>
               </DialogHeader>
               <div className='space-y-3 py-2'>
                  <p className='text-sm text-muted-foreground'>
                     Enter your current password to start 2FA setup.
                  </p>
                  <div className='space-y-1.5'>
                     <Label htmlFor='setup-pw'>Password</Label>
                     <Input
                        id='setup-pw'
                        type='password'
                        autoFocus
                        value={setupPassword}
                        onChange={(e) => { setSetupPassword(e.target.value); setSetupPasswordErr(null); }}
                        onKeyDown={(e) => e.key === "Enter" && confirmSetupPassword()}
                     />
                     {setupPasswordErr && <p className='text-xs text-(--error)'>{setupPasswordErr}</p>}
                  </div>
               </div>
               <DialogFooter>
                  <Button variant='outline' onClick={() => setSetupStep("idle")}>Cancel</Button>
                  <Button onClick={confirmSetupPassword} disabled={setupMutation.isPending}>
                     {setupMutation.isPending ? "Loading…" : "Continue"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Setup: QR + backup codes ── */}
         <Dialog
            open={setupStep === "qr"}
            onOpenChange={(o) => { if (!o) { setSetupStep("idle"); setQrUri(null); setBackupCodes([]); setSavedCodes(false); } }}
         >
            <DialogContent className='max-w-md'>
               <DialogHeader>
                  <DialogTitle>Scan QR code</DialogTitle>
               </DialogHeader>
               <div className='space-y-5 py-2'>
                  <p className='text-sm text-muted-foreground'>
                     Scan this QR code with Google Authenticator, Authy, or 1Password.
                  </p>

                  {qrUri && (
                     <div className='flex justify-center p-4 bg-white rounded-lg border'>
                        <QRCodeSVG value={qrUri} size={180} />
                     </div>
                  )}

                  <div className='space-y-2'>
                     <div className='flex items-center gap-2'>
                        <AlertTriangle className='w-4 h-4 text-(--warning) shrink-0' />
                        <p className='text-sm font-medium'>Save your backup codes</p>
                     </div>
                     <p className='text-xs text-muted-foreground'>
                        These 8 single-use codes let you access your account if you lose your device. They will not be shown again.
                     </p>
                     <CodeGrid codes={backupCodes} />
                  </div>

                  <div className='flex items-center gap-2'>
                     <Checkbox
                        id='saved-codes'
                        checked={savedCodes}
                        onCheckedChange={(c) => setSavedCodes(c === true)}
                     />
                     <label htmlFor='saved-codes' className='text-sm cursor-pointer'>
                        I have saved my backup codes
                     </label>
                  </div>
               </div>
               <DialogFooter>
                  <Button variant='outline' onClick={() => { setSetupStep("idle"); setQrUri(null); setBackupCodes([]); setSavedCodes(false); }}>
                     Cancel
                  </Button>
                  <Button
                     disabled={!savedCodes}
                     onClick={() => { setVerifyCode(""); setVerifyErr(null); setSetupStep("verify"); }}
                  >
                     I've scanned the code
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Setup: Verify code ── */}
         <Dialog
            open={setupStep === "verify"}
            onOpenChange={(o) => { if (!o) setSetupStep("idle"); }}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Verify your code</DialogTitle>
               </DialogHeader>
               <div className='space-y-3 py-2'>
                  <p className='text-sm text-muted-foreground'>
                     Enter the 6-digit code from your authenticator app to confirm setup.
                  </p>
                  <div className='space-y-1.5'>
                     <Label htmlFor='verify-code'>Verification code</Label>
                     <Input
                        id='verify-code'
                        autoFocus
                        inputMode='numeric'
                        maxLength={6}
                        placeholder='000000'
                        value={verifyCode}
                        onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "")); setVerifyErr(null); }}
                        onKeyDown={(e) => e.key === "Enter" && submitVerify()}
                        className='text-center text-2xl tracking-widest font-mono'
                     />
                     {verifyErr && <p className='text-xs text-(--error)'>{verifyErr}</p>}
                  </div>
               </div>
               <DialogFooter>
                  <Button variant='outline' onClick={() => setSetupStep("qr")}>Back</Button>
                  <Button onClick={submitVerify} disabled={verifyMutation.isPending}>
                     {verifyMutation.isPending ? "Verifying…" : (
                        <><CheckCircle2 className='w-4 h-4 mr-2' /> Enable 2FA</>
                     )}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Disable: Password confirm ── */}
         <Dialog
            open={disableStep === "password_prompt"}
            onOpenChange={(o) => { if (!o) setDisableStep("idle"); }}
         >
            <DialogContent className='max-w-sm'>
               <DialogHeader>
                  <DialogTitle>Disable two-factor authentication</DialogTitle>
               </DialogHeader>
               <div className='space-y-3 py-2'>
                  <div className='flex gap-2 p-3 rounded-lg border border-(--error)/30 bg-(--error)/5'>
                     <AlertTriangle className='w-4 h-4 text-(--error) shrink-0 mt-0.5' />
                     <p className='text-sm text-muted-foreground'>
                        Disabling 2FA removes this security layer. Your account will be protected by password only.
                     </p>
                  </div>
                  <div className='space-y-1.5'>
                     <Label htmlFor='disable-pw'>Confirm your password</Label>
                     <Input
                        id='disable-pw'
                        type='password'
                        autoFocus
                        value={disablePassword}
                        onChange={(e) => { setDisablePassword(e.target.value); setDisablePasswordErr(null); }}
                        onKeyDown={(e) => e.key === "Enter" && confirmDisable()}
                     />
                     {disablePasswordErr && <p className='text-xs text-(--error)'>{disablePasswordErr}</p>}
                  </div>
               </div>
               <DialogFooter>
                  <Button variant='outline' onClick={() => setDisableStep("idle")}>Cancel</Button>
                  <Button
                     variant='destructive'
                     onClick={confirmDisable}
                     disabled={disableMutation.isPending}
                  >
                     {disableMutation.isPending ? "Disabling…" : "Disable 2FA"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* ── Regenerate: Password + new codes ── */}
         <Dialog
            open={regenStep === "password_prompt"}
            onOpenChange={(o) => { if (!o) { setRegenStep("idle"); setNewBackupCodes([]); } }}
         >
            <DialogContent className='max-w-md'>
               <DialogHeader>
                  <DialogTitle>Regenerate backup codes</DialogTitle>
               </DialogHeader>
               <div className='space-y-4 py-2'>
                  {newBackupCodes.length === 0 ? (
                     <>
                        <p className='text-sm text-muted-foreground'>
                           Old codes will be invalidated immediately. Enter your password to generate new ones.
                        </p>
                        <div className='space-y-1.5'>
                           <Label htmlFor='regen-pw'>Password</Label>
                           <Input
                              id='regen-pw'
                              type='password'
                              autoFocus
                              value={regenPassword}
                              onChange={(e) => { setRegenPassword(e.target.value); setRegenPasswordErr(null); }}
                              onKeyDown={(e) => e.key === "Enter" && confirmRegen()}
                           />
                           {regenPasswordErr && <p className='text-xs text-(--error)'>{regenPasswordErr}</p>}
                        </div>
                     </>
                  ) : (
                     <>
                        <div className='flex items-center gap-2 p-3 rounded-lg border bg-(--success)/5 border-(--success)/30'>
                           <CheckCircle2 className='w-4 h-4 text-(--success) shrink-0' />
                           <p className='text-sm'>New backup codes generated. Save them now — they won&apos;t be shown again.</p>
                        </div>
                        <CodeGrid codes={newBackupCodes} />
                     </>
                  )}
               </div>
               <DialogFooter>
                  {newBackupCodes.length === 0 ? (
                     <>
                        <Button variant='outline' onClick={() => setRegenStep("idle")}>Cancel</Button>
                        <Button onClick={confirmRegen} disabled={regenMutation.isPending}>
                           {regenMutation.isPending ? "Generating…" : "Generate new codes"}
                        </Button>
                     </>
                  ) : (
                     <Button onClick={() => { setRegenStep("idle"); setNewBackupCodes([]); }}>Done</Button>
                  )}
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </>
   );
}
