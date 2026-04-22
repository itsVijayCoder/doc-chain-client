"use client";

import { FC, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useValidate2fa } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BlockchainBadge } from "./BlockchainBadge";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/types";
import { ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

type LoginStep = "credentials" | "2fa";

export const LoginForm: FC = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const login = useLogin();
   const validate2fa = useValidate2fa();
   const toast = useToast();

   const [step, setStep] = useState<LoginStep>("credentials");
   const [tempToken, setTempToken] = useState<string | null>(null);
   const [twoFaCode, setTwoFaCode] = useState("");
   const [useBackupCode, setUseBackupCode] = useState(false);
   const [twoFaError, setTwoFaError] = useState<string | null>(null);

   const redirectTo = searchParams.get("redirect") || "/dashboard";

   const {
      register,
      handleSubmit,
      setValue,
      formState: { errors, isSubmitting, touchedFields },
   } = useForm<LoginInput>({
      resolver: zodResolver(loginSchema),
      mode: "onBlur",
      defaultValues: { email: "", password: "", rememberMe: false },
   });

   const onSubmit = async (values: LoginInput) => {
      try {
         const result = await login.mutateAsync({
            email: values.email,
            password: values.password,
         });

         if (result.requires2fa) {
            setTempToken(result.tempToken);
            setStep("2fa");
            return;
         }

         toast.success("Welcome back!", "Login successful");
         router.push(redirectTo);
         router.refresh();
      } catch (err) {
         const apiErr = err as ApiError;
         const detail = apiErr?.details?.[0];
         toast.error("Login failed", detail || apiErr?.message || "Invalid credentials");
      }
   };

   const onSubmit2fa = async () => {
      if (!tempToken) return;
      const code = twoFaCode.trim();
      const expectedLen = useBackupCode ? 8 : 6;
      if (code.length !== expectedLen) {
         setTwoFaError(`Enter a ${expectedLen}-character ${useBackupCode ? "backup" : "TOTP"} code`);
         return;
      }
      setTwoFaError(null);
      try {
         await validate2fa.mutateAsync({ code, tempToken });
         toast.success("Welcome back!", "Login successful");
         router.push(redirectTo);
         router.refresh();
      } catch (err) {
         const apiErr = err as ApiError;
         if (apiErr?.code === "2FA_LOCKED") {
            toast.error("Too many attempts", "Try again in 15 minutes");
            setStep("credentials");
            setTempToken(null);
            setTwoFaCode("");
         } else {
            setTwoFaError(apiErr?.details?.[0] ?? apiErr?.message ?? "Invalid code");
         }
      }
   };

   const isLoading = isSubmitting || login.isPending;

   // ─── 2FA step ─────────────────────────────────────────────────────────
   if (step === "2fa") {
      return (
         <div className='space-y-6'>
            <div className='flex justify-center'>
               <BlockchainBadge size='sm' />
            </div>

            <div className='text-center space-y-1'>
               <div className='flex justify-center mb-3'>
                  <span className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
                     <ShieldCheck className='w-6 h-6 text-primary' />
                  </span>
               </div>
               <h2 className='text-xl font-semibold'>Two-factor verification</h2>
               <p className='text-sm text-muted-foreground'>
                  {useBackupCode
                     ? "Enter one of your 8-character backup codes"
                     : "Enter the 6-digit code from your authenticator app"}
               </p>
            </div>

            <div className='space-y-2'>
               <Label htmlFor='code'>
                  {useBackupCode ? "Backup code" : "Verification code"}
               </Label>
               <Input
                  id='code'
                  autoFocus
                  autoComplete='one-time-code'
                  inputMode={useBackupCode ? "text" : "numeric"}
                  maxLength={useBackupCode ? 8 : 6}
                  placeholder={useBackupCode ? "A7K2M9X4" : "000000"}
                  value={twoFaCode}
                  onChange={(e) => {
                     const val = useBackupCode
                        ? e.target.value.toUpperCase()
                        : e.target.value.replace(/\D/g, "");
                     setTwoFaCode(val);
                     setTwoFaError(null);
                  }}
                  className={cn(
                     "text-center text-2xl tracking-widest font-mono",
                     twoFaError && "border-(--error)"
                  )}
               />
               {twoFaError && (
                  <p className='text-xs text-(--error)'>{twoFaError}</p>
               )}
            </div>

            <Button
               className='w-full'
               onClick={onSubmit2fa}
               disabled={validate2fa.isPending}
            >
               {validate2fa.isPending ? (
                  <>
                     <svg className='animate-spin -ml-1 mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                     </svg>
                     Verifying…
                  </>
               ) : (
                  <><KeyRound className='w-4 h-4 mr-2' /> Verify</>
               )}
            </Button>

            <div className='flex flex-col items-center gap-2 text-sm'>
               <button
                  type='button'
                  className='text-primary hover:text-primary/80 transition-colors'
                  onClick={() => {
                     setUseBackupCode((v) => !v);
                     setTwoFaCode("");
                     setTwoFaError(null);
                  }}
               >
                  {useBackupCode
                     ? "Use authenticator app instead"
                     : "Use a backup code instead"}
               </button>
               <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
                  onClick={() => {
                     setStep("credentials");
                     setTempToken(null);
                     setTwoFaCode("");
                     setTwoFaError(null);
                     setUseBackupCode(false);
                  }}
               >
                  <ArrowLeft className='w-3 h-3' />
                  Back to login
               </button>
            </div>
         </div>
      );
   }

   // ─── Credentials step ─────────────────────────────────────────────────
   return (
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
         <div className='flex justify-center'>
            <BlockchainBadge size='sm' />
         </div>

         <div className='space-y-2'>
            <Label htmlFor='email'>Email address</Label>
            <Input
               id='email'
               type='email'
               autoComplete='email'
               placeholder='you@example.com'
               aria-invalid={!!errors.email}
               {...register("email")}
               className={cn(
                  errors.email &&
                     touchedFields.email &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.email && (
               <p className='text-xs text-(--error)'>{errors.email.message}</p>
            )}
         </div>

         <div className='space-y-2'>
            <div className='flex items-center justify-between'>
               <Label htmlFor='password'>Password</Label>
               <Link
                  href='/forgot-password'
                  className='text-xs text-primary hover:text-primary/80 transition-colors'
               >
                  Forgot password?
               </Link>
            </div>
            <Input
               id='password'
               type='password'
               autoComplete='current-password'
               placeholder='••••••••'
               aria-invalid={!!errors.password}
               {...register("password")}
               className={cn(
                  errors.password &&
                     touchedFields.password &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.password && (
               <p className='text-xs text-(--error)'>
                  {errors.password.message}
               </p>
            )}
         </div>

         <div className='flex items-center space-x-2'>
            <Checkbox
               id='rememberMe'
               onCheckedChange={(checked) =>
                  setValue("rememberMe", checked === true)
               }
            />
            <label
               htmlFor='rememberMe'
               className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
               Remember me for 30 days
            </label>
         </div>

         <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
               <>
                  <svg
                     className='animate-spin -ml-1 mr-2 h-4 w-4'
                     fill='none'
                     viewBox='0 0 24 24'
                  >
                     <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                     />
                     <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                     />
                  </svg>
                  Signing in...
               </>
            ) : (
               "Sign in"
            )}
         </Button>

         <p className='text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{" "}
            <Link
               href='/register'
               className='text-primary hover:text-primary/80 font-medium transition-colors'
            >
               Sign up
            </Link>
         </p>
      </form>
   );
};
