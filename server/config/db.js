const odbc = require('odbc');

const SSMS_CONN_STRING = process.env.SSMS_CONN_STRING;

if (!SSMS_CONN_STRING) {
  console.error('SSMS_CONN_STRING environment variable is required');
  process.exit(1);
}

/**
 * Get a database connection
 * @returns {Promise<odbc.Connection>}
 */
const getConnection = async () => {

  const conn = await odbc.connect(SSMS_CONN_STRING);
  return conn;
};

module.exports = {
  getConnection,
  SSMS_CONN_STRING
};

