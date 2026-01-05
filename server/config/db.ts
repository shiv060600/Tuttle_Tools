import sql from 'mssql';

const DB_SERVER = process.env.DB_SERVER || 'tutpub4.tuttlepub.com';
const DB_NAME = process.env.DB_NAME || 'IPS';
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

if (!DB_USER || !DB_PASS) {
  console.error('DB_USER and DB_PASS environment variables are required');
  process.exit(1);
}

const config: sql.config = {
  server: DB_SERVER,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

const getConnection = async (): Promise<sql.ConnectionPool> => {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    console.log('Attempting database connection...');
    console.log('Server:', DB_SERVER, 'Database:', DB_NAME);
    
    pool = await sql.connect(config);
    console.log(' Database connection successful');
    return pool;
  } catch (error) {
    console.error(' Database connection failed:', error);
    throw error;
  }
};

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, closing database connections...`);
  if (pool) {
    await pool.close();
    console.log('Database connections closed');
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { getConnection };

