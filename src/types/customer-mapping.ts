export type MappingType = 'original' | 'ips' | 'ing';

export interface CustomerMapping {
  rowNum: number;
  billto: string | null;
  shipto: string | null;
  hq: string;
  ssacct: string;
  nameCust: string | null;
}

export interface CreateCustomerMappingDto {
  billto?: string;
  shipto?: string | null;
  hq: string;
  ssacct: string;
}

export interface UpdateCustomerMappingDto {
  billto?: string;
  shipto?: string | null;
  hq?: string;
  ssacct?: string;
}

// IPS-specific DTOs (no billto/shipto)
export interface CreateIPSMappingDto {
  hq: string;
  ssacct: string;
}

export interface UpdateIPSMappingDto {
  hq?: string;
  ssacct?: string;
}
