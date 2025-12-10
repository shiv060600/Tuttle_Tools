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

