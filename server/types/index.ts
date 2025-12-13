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

export interface LogDeleteResponse{
  deleted_count: Number;
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
};

type ActionType = 'insert' | 'edit';
export interface CreateLoggingBody{
  action: ActionType;
  rowNum?: number | null;
  billto_from?: string | null;
  shipto_from?: string | null;
  HQ_from?: string | null;
  Ssacct_from?: string | null;
  billto_to?: string | null;
  shipto_to?: string | null;
  HQ_to?: string | null;
  Ssacct_to?: string | null;
  ACTION_TIMESTAMP: string;
}

