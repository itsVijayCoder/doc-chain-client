// Auth token plumbing. Access token lives in module memory (dies with tab).
// Refresh token lives in localStorage so it survives hard reloads and is
// visible to sibling tabs. This module is the ONLY place that touches either.
//
// IMPORTANT: do not import this from a server component. Next.js App Router
// compiles some modules for both server and client — the functions here no-op
// or throw on the server to catch accidental imports.

import { decodeJwt } from "./jwt";

const REFRESH_STORAGE_KEY = "docchain.refresh_token";
const CHANGE_EVENT = "docchain:auth:change";

export interface TokenState {
   accessToken: string | null;
   refreshToken: string | null;
}

let memoryAccessToken: string | null = null;
let eventBus: EventTarget | null = null;
let initialized = false;

function isBrowser(): boolean {
   return typeof window !== "undefined";
}

function init() {
   if (initialized || !isBrowser()) return;
   initialized = true;
   eventBus = new EventTarget();

   // Cross-tab sync for refresh token changes. If another tab writes a new
   // refresh token to localStorage (rotation after refresh, or logout), we
   // want to reflect that here. Access token itself is per-tab in memory
   // and stays independent — that's fine because each access token is
   // individually valid until its own exp.
   window.addEventListener("storage", (e) => {
      if (e.key !== REFRESH_STORAGE_KEY) return;
      if (e.newValue === null) {
         // Another tab cleared the refresh token (logout). Mirror the
         // logout locally by dropping the in-memory access token too.
         memoryAccessToken = null;
         emitChange();
      }
   });
}

function emitChange() {
   if (!eventBus) return;
   const detail: TokenState = {
      accessToken: memoryAccessToken,
      refreshToken: isBrowser() ? localStorage.getItem(REFRESH_STORAGE_KEY) : null,
   };
   eventBus.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail }));
}

export function getAccessToken(): string | null {
   if (!isBrowser()) return null;
   return memoryAccessToken;
}

export function getRefreshToken(): string | null {
   if (!isBrowser()) return null;
   return localStorage.getItem(REFRESH_STORAGE_KEY);
}

export function setTokens(tokens: {
   accessToken: string;
   refreshToken: string;
}): void {
   if (!isBrowser()) return;
   init();
   memoryAccessToken = tokens.accessToken;
   localStorage.setItem(REFRESH_STORAGE_KEY, tokens.refreshToken);
   emitChange();
}

export function setAccessTokenOnly(accessToken: string): void {
   if (!isBrowser()) return;
   init();
   memoryAccessToken = accessToken;
   emitChange();
}

export function clearTokens(): void {
   if (!isBrowser()) return;
   init();
   memoryAccessToken = null;
   localStorage.removeItem(REFRESH_STORAGE_KEY);
   emitChange();
}

export function onTokensChange(
   listener: (state: TokenState) => void
): () => void {
   if (!isBrowser()) return () => {};
   init();
   const handler = (e: Event) =>
      listener((e as CustomEvent<TokenState>).detail);
   eventBus!.addEventListener(CHANGE_EVENT, handler);
   return () => eventBus?.removeEventListener(CHANGE_EVENT, handler);
}

// Seconds until access token expiry, or null if no token / undecodable.
// Used by the api.ts request interceptor to decide when to refresh proactively.
export function getAccessTokenSecondsLeft(): number | null {
   const token = getAccessToken();
   if (!token) return null;
   const claims = decodeJwt(token);
   if (!claims?.exp) return null;
   return claims.exp - Math.floor(Date.now() / 1000);
}

export function hasAnyToken(): boolean {
   return !!(getAccessToken() || getRefreshToken());
}
