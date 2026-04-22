// Lightweight JWT claim decoder. No signature verification — we trust our
// own backend's signature; this is purely to read `exp` and roles for UX
// decisions (proactive refresh, optimistic role gating on reload).

export interface JwtClaims {
   sub?: string;
   user_id?: string;
   email?: string;
   roles?: string[];
   exp?: number;
   iat?: number;
   [key: string]: unknown;
}

export function decodeJwt(token: string): JwtClaims | null {
   try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const json =
         typeof atob === "function"
            ? atob(padded)
            : Buffer.from(padded, "base64").toString("utf-8");
      return JSON.parse(json) as JwtClaims;
   } catch {
      return null;
   }
}
