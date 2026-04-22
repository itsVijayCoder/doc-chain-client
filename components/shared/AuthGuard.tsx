"use client";

import { FC, ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/lib/hooks/useAuth";
import { getAccessToken, getRefreshToken } from "@/lib/auth/tokens";

interface AuthGuardProps {
   children: ReactNode;
   /**
    * Optional: restrict access to users whose `roles[]` includes one of the
    * given slugs. If omitted, any authenticated user may enter.
    */
   requireRoles?: string[];
   /**
    * Where to send unauthenticated users. Defaults to /login, preserving the
    * current path so the login flow can redirect back after success.
    */
   loginRedirect?: string;
}

export const AuthGuard: FC<AuthGuardProps> = ({
   children,
   requireRoles,
   loginRedirect = "/login",
}) => {
   const router = useRouter();
   const pathname = usePathname();
   const { data: user, isLoading, isFetching } = useMe();

   // Compute token presence synchronously so the first render can decide
   // whether to even attempt a useMe fetch (vs. redirecting immediately).
   const hasToken =
      typeof window !== "undefined" &&
      (!!getAccessToken() || !!getRefreshToken());

   useEffect(() => {
      if (isLoading || isFetching) return;

      // No token at all → nothing to revalidate, send to login.
      if (!hasToken) {
         redirectToLogin(router, loginRedirect, pathname);
         return;
      }

      // Had a token but me() resolved null → refresh failed or JWT invalid.
      if (user === null) {
         redirectToLogin(router, loginRedirect, pathname);
         return;
      }

      // Authenticated but missing a required role → send to dashboard root.
      if (user && requireRoles && requireRoles.length > 0) {
         const ok = requireRoles.some((r) => (user.roles ?? []).includes(r));
         if (!ok) {
            router.replace("/dashboard");
         }
      }
   }, [
      hasToken,
      isLoading,
      isFetching,
      user,
      requireRoles,
      router,
      pathname,
      loginRedirect,
   ]);

   // Still checking: show a minimal loader.
   if (isLoading || (hasToken && user === undefined)) {
      return (
         <div className='flex items-center justify-center min-h-screen'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary' />
         </div>
      );
   }

   // Blocked: render nothing while the redirect effect runs.
   if (!user) return null;
   if (requireRoles && requireRoles.length > 0) {
      const ok = requireRoles.some((r) => (user.roles ?? []).includes(r));
      if (!ok) return null;
   }

   return <>{children}</>;
};

function redirectToLogin(
   router: ReturnType<typeof useRouter>,
   loginPath: string,
   currentPath: string
) {
   const target =
      currentPath && currentPath !== loginPath
         ? `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
         : loginPath;
   router.replace(target);
}
