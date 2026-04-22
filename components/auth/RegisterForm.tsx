"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BlockchainBadge } from "./BlockchainBadge";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/types";

export const RegisterForm: FC = () => {
   const router = useRouter();
   const register = useRegister();
   const toast = useToast();

   const {
      register: rhfRegister,
      handleSubmit,
      setValue,
      watch,
      formState: { errors, isSubmitting, touchedFields },
   } = useForm<RegisterInput>({
      resolver: zodResolver(registerSchema),
      mode: "onBlur",
      defaultValues: {
         name: "",
         email: "",
         password: "",
         confirmPassword: "",
         agreeToTerms: false as unknown as true,
      },
   });

   const watchedPassword = watch("password");

   const onSubmit = async (values: RegisterInput) => {
      try {
         await register.mutateAsync({
            name: values.name,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            agreeToTerms: values.agreeToTerms,
         });
         toast.success(
            "Account created!",
            "Welcome to DocChain. Your account is now protected by blockchain technology."
         );
         router.push("/dashboard");
      } catch (err) {
         const apiErr = err as ApiError;
         const detail = apiErr?.details?.[0];
         if (apiErr?.code === "USER_ALREADY_EXISTS") {
            toast.error(
               "Registration failed",
               "An account with this email already exists"
            );
            return;
         }
         toast.error(
            "Registration failed",
            detail || apiErr?.message || "Something went wrong"
         );
      }
   };

   const isLoading = isSubmitting || register.isPending;

   return (
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
         <div className='flex justify-center'>
            <BlockchainBadge size='sm' />
         </div>

         <div className='space-y-2'>
            <Label htmlFor='name'>Full name</Label>
            <Input
               id='name'
               type='text'
               autoComplete='name'
               placeholder='John Doe'
               aria-invalid={!!errors.name}
               {...rhfRegister("name")}
               className={cn(
                  errors.name &&
                     touchedFields.name &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.name && (
               <p className='text-xs text-(--error)'>{errors.name.message}</p>
            )}
         </div>

         <div className='space-y-2'>
            <Label htmlFor='email'>Email address</Label>
            <Input
               id='email'
               type='email'
               autoComplete='email'
               placeholder='you@example.com'
               aria-invalid={!!errors.email}
               {...rhfRegister("email")}
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
            <Label htmlFor='password'>Password</Label>
            <Input
               id='password'
               type='password'
               autoComplete='new-password'
               placeholder='••••••••'
               aria-invalid={!!errors.password}
               {...rhfRegister("password")}
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
            {watchedPassword && (
               <div className='pt-2'>
                  <PasswordStrengthMeter password={watchedPassword} />
               </div>
            )}
         </div>

         <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm password</Label>
            <Input
               id='confirmPassword'
               type='password'
               autoComplete='new-password'
               placeholder='••••••••'
               aria-invalid={!!errors.confirmPassword}
               {...rhfRegister("confirmPassword")}
               className={cn(
                  errors.confirmPassword &&
                     touchedFields.confirmPassword &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.confirmPassword && (
               <p className='text-xs text-(--error)'>
                  {errors.confirmPassword.message}
               </p>
            )}
         </div>

         <div className='space-y-2'>
            <div className='flex items-start space-x-2'>
               <Checkbox
                  id='agreeToTerms'
                  onCheckedChange={(checked) =>
                     setValue("agreeToTerms", checked === true ? true : (false as unknown as true), {
                        shouldValidate: true,
                     })
                  }
                  className={cn(errors.agreeToTerms && "border-(--error)")}
               />
               <label
                  htmlFor='agreeToTerms'
                  className='text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
               >
                  I agree to the{" "}
                  <Link
                     href='/terms'
                     className='text-primary hover:text-primary/80 underline'
                  >
                     Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                     href='/privacy'
                     className='text-primary hover:text-primary/80 underline'
                  >
                     Privacy Policy
                  </Link>
               </label>
            </div>
            {errors.agreeToTerms && (
               <p className='text-xs text-(--error) ml-6'>
                  {errors.agreeToTerms.message}
               </p>
            )}
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
                  Creating account...
               </>
            ) : (
               "Create account"
            )}
         </Button>

         <p className='text-center text-sm text-muted-foreground'>
            Already have an account?{" "}
            <Link
               href='/login'
               className='text-primary hover:text-primary/80 font-medium transition-colors'
            >
               Sign in
            </Link>
         </p>

         <div className='p-3 rounded-lg bg-ai/5 border border-ai/10'>
            <div className='flex items-start gap-2'>
               <svg
                  className='w-4 h-4 text-ai mt-0.5 shrink-0'
                  fill='currentColor'
                  viewBox='0 0 20 20'
               >
                  <path
                     fillRule='evenodd'
                     d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                     clipRule='evenodd'
                  />
               </svg>
               <p className='text-xs text-muted-foreground'>
                  Your account will be secured with blockchain technology and
                  enhanced with AI-powered features for document management.
               </p>
            </div>
         </div>
      </form>
   );
};
