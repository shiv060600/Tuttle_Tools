import odbc, { Connection } from 'odbc';

const SSMS_CONN_STRING: string | undefined = process.env.SSMS_CONN_STRING;

if (!SSMS_CONN_STRING) {
  console.error('SSMS_CONN_STRING environment variable is required');
  process.exit(1);
}

/**
 * Get a database connection
 * @returns Promise resolving to an ODBC connection
 */
const getConnection = async (): Promise<Connection> => {
  const conn = await odbc.connect(SSMS_CONN_STRING as string);
  return conn;
};

export { getConnection, SSMS_CONN_STRING };

