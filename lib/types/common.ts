export interface StoreState {
   isLoading: boolean;
   error: string | null;
}

export interface PaginatedResponse<T> {
   data: T[];
   total: number;
   page: number;
   pageSize: number;
   hasMore: boolean;
}

export interface ApiError {
   message: string;
   code?: string;
   statusCode: number;
   details?: string[];
   requestId?: string;
}

export interface Activity {
   id: string;
   type:
      | "upload"
      | "share"
      | "delete"
      | "verify"
      | "edit"
      | "view"
      | "blockchain_verify"
      | "protect"
      | "unprotect"
      | "user_add"
      | "settings";
   userId: string;
   userName: string;
   userAvatar?: string;
   documentId?: string;
   documentTitle?: string;
   message: string;
   description: string;
   timestamp: Date;
   metadata?: Record<string, any>;
}

export interface Notification {
   id: string;
   type: "info" | "success" | "warning" | "error";
   title: string;
   message: string;
   timestamp: Date;
   isRead: boolean;
   actionUrl?: string;
   actionLabel?: string;
}

export interface DashboardStats {
   totalDocuments: number;
   sharedDocuments: number;
   protectedDocuments: number;
   protectionPercentage: number;
   recentUploads: number;
   storageUsed: number;
   storageLimit: number;
}

export interface SystemStats {
   totalUsers: number;
   activeUsers: number;
   totalDocuments: number;
   totalStorage: number;
   storageLimit: number;
   blockchainTransactions: number;
   apiCalls: number;
}

export interface AuditLog {
   id: string;
   userId: string;
   userName: string;
   action: string;
   resourceType: "document" | "user" | "settings" | "system";
   resourceId?: string;
   resourceName?: string;
   ipAddress: string;
   userAgent: string;
   status: "success" | "failure";
   details?: Record<string, any>;
   timestamp: Date;
   blockchainVerified?: boolean;
}

export interface SearchHistory {
   id: string;
   query: string;
   timestamp: Date;
   resultsCount: number;
}

export interface SavedSearch {
   id: string;
   name: string;
   query: string;
   filters: Record<string, any>;
   createdAt: Date;
}
