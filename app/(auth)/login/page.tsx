import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
   return (
      <AuthLayout
         title='Welcome back'
         subtitle='Sign in to your DocChain account'
      >
         <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
            <LoginForm />
         </Suspense>
      </AuthLayout>
   );
}
