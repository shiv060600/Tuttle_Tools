// ============ Database/Domain Types ============
export interface CustomerMapping {
  rowNum: number;
  billto: string;
  shipto: string;
  hq: string;
  ssacct: string;
  nameCust?: string;
}

// ============ Request Body Types ============
export interface CreateMappingBody {
  billto: string;
  shipto?: string;
  hq: string;
  ssacct: string;
}

export interface UpdateMappingBody {
  billto?: string;
  shipto?: string;
  hq?: string;
  ssacct?: string;
}

export interface LogEntryBody {
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CountResponse {
  inserted?: number;
  updated?: number;
  deleted?: number;
}

export interface LogDeleteResponse {
    deleted_count?: number;
}

export interface CreateLoggingBody {
    action: 'edit' | 'insert' | 'delete';
    rowNum?: number;
    billto_from?: string;
    shipto_from?: string;
    HQ_from?: string;
    Ssacct_from?: string;
    billto_to?: string;
    shipto_to?: string;
    HQ_to?: string;
    Ssacct_to?: string;
    ACTION_TIMESTAMP?: string;
}
