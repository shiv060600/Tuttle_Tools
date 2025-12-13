export type ActionType = 'insert' | 'edit';

export interface LoggingBody {
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

// Normalized log entry returned from API (camel-cased)
export interface LogEntry {
  logId?: string | null;
  rowNum?: number | null;
  action: ActionType | string;
  billtoFrom?: string | null;
  shiptoFrom?: string | null;
  hqFrom?: string | null;
  ssacctFrom?: string | null;
  billtoTo?: string | null;
  shiptoTo?: string | null;
  hqTo?: string | null;
  ssacctTo?: string | null;
  actionTimestamp: string;
}

export interface LogDeleteResponse {
  deleted_count: number;
}