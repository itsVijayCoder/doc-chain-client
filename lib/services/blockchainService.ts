import { apiClient } from "./api";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/blockchain.go
// ─────────────────────────────────────────────────────────────────────────

export type BlockchainRecordStatus = "pending" | "confirmed" | "failed";

interface BackendBlockchainRecord {
   id: string;
   document_id: string;
   version_id?: string;
   record_type: string;
   file_hash: string;
   tx_id?: string;
   block_number?: number;
   status: BlockchainRecordStatus;
   error_message?: string;
   submitted_at?: string;
   confirmed_at?: string;
   created_at: string;
}

interface BackendVerifyResponse {
   verified: boolean;
   file_hash: string;
   chain_hash: string;
   tx_id?: string;
   block_number?: number;
   confirmed_at?: string;
   message: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Frontend shapes
// ─────────────────────────────────────────────────────────────────────────

export interface BlockchainRecord {
   id: string;
   documentId: string;
   versionId?: string;
   recordType: string;
   fileHash: string;
   txId?: string;
   blockNumber?: number;
   status: BlockchainRecordStatus;
   errorMessage?: string;
   submittedAt?: Date;
   confirmedAt?: Date;
   createdAt: Date;
}

export interface VerificationResult {
   verified: boolean;
   fileHash: string;
   chainHash: string;
   txId?: string;
   blockNumber?: number;
   confirmedAt?: Date;
   message: string;
}

function adaptRecord(raw: BackendBlockchainRecord): BlockchainRecord {
   return {
      id: raw.id,
      documentId: raw.document_id,
      versionId: raw.version_id,
      recordType: raw.record_type,
      fileHash: raw.file_hash,
      txId: raw.tx_id,
      blockNumber: raw.block_number,
      status: raw.status,
      errorMessage: raw.error_message,
      submittedAt: raw.submitted_at ? new Date(raw.submitted_at) : undefined,
      confirmedAt: raw.confirmed_at ? new Date(raw.confirmed_at) : undefined,
      createdAt: new Date(raw.created_at),
   };
}

function adaptVerify(raw: BackendVerifyResponse): VerificationResult {
   return {
      verified: raw.verified,
      fileHash: raw.file_hash,
      chainHash: raw.chain_hash,
      txId: raw.tx_id,
      blockNumber: raw.block_number,
      confirmedAt: raw.confirmed_at ? new Date(raw.confirmed_at) : undefined,
      message: raw.message,
   };
}

// ─────────────────────────────────────────────────────────────────────────
// blockchainService
// ─────────────────────────────────────────────────────────────────────────

export const blockchainService = {
   /** List all blockchain submissions (pending/confirmed/failed) for a document. */
   listByDocument: async (documentId: string): Promise<BlockchainRecord[]> => {
      const raw = await apiClient.get<BackendBlockchainRecord[]>(
         `/documents/${documentId}/blockchain`
      );
      return (raw ?? []).map(adaptRecord);
   },

   /** Run a live verification — compares current file hash against on-chain hash. */
   verifyDocument: async (documentId: string): Promise<VerificationResult> => {
      const raw = await apiClient.post<BackendVerifyResponse>(
         `/documents/${documentId}/blockchain/verify`
      );
      return adaptVerify(raw);
   },
};
