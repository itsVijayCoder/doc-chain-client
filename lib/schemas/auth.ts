import { z } from "zod";

// Backend binding: email (email format), password (min 8).
// Frontend adds friendlier error messages + mirrors the same rules.
export const loginSchema = z.object({
   email: z.string().min(1, "Email is required").email("Invalid email address"),
   password: z.string().min(1, "Password is required"),
   rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Backend binding: first_name, last_name, email, password (min 8).
// Frontend keeps a single `name` for UX ergonomics; the authService splits it
// on the first whitespace before sending to the backend.
export const registerSchema = z
   .object({
      name: z
         .string()
         .min(2, "Name must be at least 2 characters")
         .refine((v) => v.trim().includes(" "), {
            message: "Please enter both first and last name",
         }),
      email: z
         .string()
         .min(1, "Email is required")
         .email("Invalid email address"),
      password: z
         .string()
         .min(8, "Password must be at least 8 characters")
         .regex(/[A-Z]/, "Password must contain an uppercase letter")
         .regex(/[a-z]/, "Password must contain a lowercase letter")
         .regex(/[0-9]/, "Password must contain a number"),
      confirmPassword: z.string().min(1, "Please confirm your password"),
      agreeToTerms: z.literal(true, {
         errorMap: () => ({
            message: "You must agree to the terms and conditions",
         }),
      }),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
   });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
   email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
   .object({
      token: z.string().min(1, "Token is required"),
      newPassword: z
         .string()
         .min(8, "Password must be at least 8 characters")
         .regex(/[A-Z]/, "Password must contain an uppercase letter")
         .regex(/[a-z]/, "Password must contain a lowercase letter")
         .regex(/[0-9]/, "Password must contain a number"),
      confirmPassword: z.string().min(1, "Please confirm your password"),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
   });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
