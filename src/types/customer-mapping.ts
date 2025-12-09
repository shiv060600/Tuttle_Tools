export interface CustomerMapping {
  rowNum: number;
  billto: string;
  shipto: string | null;
  hq: string;
  ssacct: string;
}

export interface CreateCustomerMappingDto {
  billto: string;
  shipto: string | null;
  hq: string;
  ssacct: string;
}

export interface UpdateCustomerMappingDto {
  billto?: string;
  shipto?: string | null;
  hq?: string;
  ssacct?: string;
}
