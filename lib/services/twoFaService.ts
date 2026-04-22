import { apiClient } from "./api";

export interface TwoFaStatusResponse {
   enabled: boolean;
   verified_at?: string;
   backup_codes_remaining: number;
}

export interface TwoFaSetupResponse {
   qr_uri: string;
   backup_codes: string[];
}

export interface TwoFaVerifyResponse {
   success: boolean;
   message: string;
   backup_codes_remaining: number;
}

export interface BackupCodesResponse {
   backup_codes: string[];
   backup_codes_remaining: number;
}

export const twoFaService = {
   getStatus: (): Promise<TwoFaStatusResponse> =>
      apiClient.get("/users/me/2fa/status"),

   setup: (password: string): Promise<TwoFaSetupResponse> =>
      apiClient.post("/users/me/2fa/setup", { password }),

   verify: (code: string): Promise<TwoFaVerifyResponse> =>
      apiClient.post("/users/me/2fa/verify", { code }),

   disable: (password: string): Promise<{ success: boolean; message: string }> =>
      apiClient.delete("/users/me/2fa", { data: { password } }),

   regenerateBackupCodes: (password: string): Promise<BackupCodesResponse> =>
      apiClient.post("/users/me/2fa/backup-codes", { password }),
};
