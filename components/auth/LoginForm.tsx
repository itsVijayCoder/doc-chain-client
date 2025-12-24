"use client";

import { FC, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { isValidEmail } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BlockchainBadge } from "./BlockchainBadge";
import { cn } from "@/lib/utils";

export const LoginForm: FC = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const { login, isLoading } = useAuth();
   const toast = useToast();

   const redirectTo = searchParams.get("redirect") || "/dashboard";

   const [formData, setFormData] = useState({
      email: "",
      password: "",
      rememberMe: false,
   });

   const [errors, setErrors] = useState<Record<string, string>>({});
   const [touched, setTouched] = useState<Record<string, boolean>>({});

   // Real-time validation
   const validateField = (name: string, value: any) => {
      switch (name) {
         case "email":
            if (!value) return "Email is required";
            if (!isValidEmail(value)) return "Invalid email address";
            return "";
         case "password":
            if (!value) return "Password is required";
            return "";
         default:
            return "";
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field was touched
      if (touched[name]) {
         const error = validateField(name, value);
         setErrors((prev) => ({ ...prev, [name]: error }));
      }
   };

   const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
   };

   const handleCheckboxChange = (checked: boolean) => {
      setFormData((prev) => ({ ...prev, rememberMe: checked }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const newErrors: Record<string, string> = {};
      Object.keys(formData).forEach((key) => {
         if (key !== "rememberMe") {
            const error = validateField(
               key,
               formData[key as keyof typeof formData]
            );
            if (error) newErrors[key] = error;
         }
      });

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
         toast.error("Please fix the errors before submitting");
         return;
      }

      try {
         await login({
            email: formData.email,
            password: formData.password,
         });

         toast.success("Welcome back!", "Login successful");

         // Use setTimeout to ensure state is updated before redirect
         setTimeout(() => {
            router.push(redirectTo);
            router.refresh();
         }, 100);
      } catch (error: any) {
         toast.error("Login failed", error.message || "Invalid credentials");
      }
   };

   return (
      <form onSubmit={handleSubmit} className='space-y-6'>
         {/* Blockchain Badge */}
         <div className='flex justify-center'>
            <BlockchainBadge size='sm' />
         </div>

         {/* Email Field */}
         <div className='space-y-2'>
            <Label htmlFor='email'>Email address</Label>
            <Input
               id='email'
               name='email'
               type='email'
               autoComplete='email'
               placeholder='you@example.com'
               value={formData.email}
               onChange={handleChange}
               onBlur={handleBlur}
               className={cn(
                  errors.email &&
                     touched.email &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.email && touched.email && (
               <p className='text-xs text-(--error)'>{errors.email}</p>
            )}
         </div>

         {/* Password Field */}
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
               name='password'
               type='password'
               autoComplete='current-password'
               placeholder='••••••••'
               value={formData.password}
               onChange={handleChange}
               onBlur={handleBlur}
               className={cn(
                  errors.password &&
                     touched.password &&
                     "border-(--error) focus-visible:ring-(--error)"
               )}
            />
            {errors.password && touched.password && (
               <p className='text-xs text-(--error)'>{errors.password}</p>
            )}
         </div>

         {/* Remember Me */}
         <div className='flex items-center space-x-2'>
            <Checkbox
               id='rememberMe'
               checked={formData.rememberMe}
               onCheckedChange={handleCheckboxChange}
            />
            <label
               htmlFor='rememberMe'
               className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
               Remember me for 30 days
            </label>
         </div>

         {/* Submit Button */}
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

         {/* Demo Credentials Info */}
         {(process.env.NODE_ENV === "development" ||
            process.env.NEXT_PUBLIC_DEMO_MODE === "true") && (
            <div className='p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 space-y-2'>
               <p className='text-xs font-semibold text-muted-foreground text-center'>
                  {process.env.NEXT_PUBLIC_DEMO_MODE === "true"
                     ? "🎭 Demo Credentials"
                     : "🧪 Test Credentials (Dev Only)"}
               </p>
               <div className='grid gap-2 text-xs'>
                  <div className='flex justify-between items-center p-2 rounded bg-background/50'>
                     <div>
                        <p className='font-medium'>Admin Account</p>
                        <p className='text-muted-foreground'>
                           admin@docchain.com / admin123
                        </p>
                     </div>
                     <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                           setFormData({
                              email: "admin@docchain.com",
                              password: "admin123",
                              rememberMe: false,
                           });
                           setErrors({});
                        }}
                     >
                        Fill
                     </Button>
                  </div>
                  <div className='flex justify-between items-center p-2 rounded bg-background/50'>
                     <div>
                        <p className='font-medium'>Standard User</p>
                        <p className='text-muted-foreground'>
                           user@docchain.com / user123
                        </p>
                     </div>
                     <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                           setFormData({
                              email: "user@docchain.com",
                              password: "user123",
                              rememberMe: false,
                           });
                           setErrors({});
                        }}
                     >
                        Fill
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Register Link */}
         <p className='text-center text-sm text-muted-foreground'>
            Don't have an account?{" "}
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
