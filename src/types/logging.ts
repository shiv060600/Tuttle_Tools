type ActionType = 'instert' | 'edit';
export interface LoggingBody{
  action: ActionType;
  rowNum?: number | null;
  billto_from?: string | null;
  shipto_from: string | null;
  HQ_from?: string | null;
  Ssacct_from?: string | null;
  billto_to?: string | null;
  shipto_to: string | null;
  HQ_to?: string | null;
  Ssacct_to?: string | null;
  ACTION_TIMESTAMP: string;
}
