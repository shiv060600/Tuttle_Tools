import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerMapping, CreateCustomerMappingDto, UpdateCustomerMappingDto } from '../types/customer-mapping';
import 'dotenv/config';
import odbc from 'odbc'


// Mock data - replace with your actual API calls
const mockData: CustomerMapping[] = [
  { rowNum: 1, billto: 'SL001', shipto: null, hq: 'HQ001', ssacct: 'SA12345' },
  { rowNum: 2, billto: 'SL002', shipto: 'ST001', hq: 'HQ002', ssacct: 'SA12346' },
  { rowNum: 3, billto: 'SL003', shipto: null, hq: 'HQ001', ssacct: 'SA12347' },
  { rowNum: 4, billto: 'SL004', shipto: 'ST002', hq: 'HQ003', ssacct: 'SA12348' },
  { rowNum: 5, billto: 'SL005', shipto: null, hq: 'HQ002', ssacct: 'SA12349' },
];



const SSMS_CONN_STRING = process.env.SSMS_CONN_STRING!;

if (!SSMS_CONN_STRING){
  throw new Error("SSMS Conn String Required")
}

const checkTime = () => {
  //if time is between 6 - 8 am no changes allowed
  const now = new Date();
  const hours = now.getHours();
  if (hours >= 6 && hours <= 8) {
    return true;
  }
  return false;
};


const getCustomerMappings = () => {
  return useQuery({
    queryKey: ['mappings'],
    queryFn: async () =>{

      let conn: odbc.Connection | undefined;  

      try {
        conn =  await odbc.connect(SSMS_CONN_STRING);
        const query = (
          `
          SELECT 
            Billto,
            Shipto,
            HQ as HQ_NUMBER,
            Ssacct as SAGE_ACCOUNT_NUMBER,
            NAMECUST 
          FROM 
            IPS.dbo.crossref as c LEFT JOIN TUTLIV.dbo.ARCUS as a on c.Ssacct = a.IDCUST 
          `)
        const result = await conn.query(query)
      }catch(err){
        console.error(`error fetching mapping from db ${err}`)
      }finally{
        if (conn){
          await conn.close()
        }
      };
    }
  })
}