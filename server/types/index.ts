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

export interface GetBookParamsDict {
  isbn : string
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

export interface Book {
  ISBN: string | null;
  TITLE: string | null;
  PROD_TYPE: string | null;
  PUB_DATE: string | null;
  PUB_STATUS: string | null;
  PROD_CLASS: string | null;
  SEAS: string | null;
  SUB_PUB: string | null;
  RETAIL_PRICE: number | null;
  WEBCAT1: string | null;
  WEBCAT2: string | null;
  WEBCAT2_DESCR: string | null;
  WEBCAT3: string | null;
  BISAC_CODE: string | null;
  QTY_ON_HAND: number | null | 0;  
  QTY_ON_ORDER: number | null |0 ; 
  WATCH: string | null;
  CTNQTY: number | null;
  OLD_CTN_QTY: number | null;
  MINRPTQTY: string | null;
  GENERAL_COMMENTS: string | null;
  INTERNAL_COMMENTS: string | null;
  IWD: string | null;
  PUBLISHER: string | null;
  EXPDATE: string | null;
  SELLOFF: string | null;
  LAST_COST: number | null;
  IPS_ON_HAND: number | null;
  IPS_ON_ORDER: number | null;
  OPC: string | null;
  PO_COMMENTS: string | null;
}