import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: String.raw`H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping\.env.local` });

// Import routes
import mappingsRoutes from './routes/mappings';
import loggingRoutes  from './routes/logger';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/mappings', mappingsRoutes);
app.use('/api/logging', loggingRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, (): void => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\n📋 Available API Endpoints:\n`);
  console.log(`  Mappings:`);
  console.log(`    GET    /api/mappings          - Get all mappings`);
  console.log(`    POST   /api/mappings          - Create mapping`);
  console.log(`    PUT    /api/mappings/:rowNum  - Update mapping`);
  console.log(`    DELETE /api/mappings/:rowNum  - Delete mapping\n`);
  console.log(`  Logging:`);
  console.log(`    GET    /api/logging           - Get all logs`);
  console.log(`    POST   /api/logging           - Create log entry`);
  console.log(`    DELETE /api/logging/:days     - Delete logs older than X days`);
  console.log(`    DELETE /api/logging/id/:logId - Delete specific log\n`);
  console.log(`  Health:`);
  console.log(`    GET    /api/health            - Health check\n`);
  console.log(`${'='.repeat(50)}\n`);
});

