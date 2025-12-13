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

// Mount routes
app.use('/api/mappings', mappingsRoutes);
app.use('api/logging',loggingRoutes);

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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/mappings`);
  console.log(`  POST   /api/mappings`);
  console.log(`  PUT    /api/mappings/:rowNum`);
  console.log(`  DELETE /api/mappings/:rowNum`);
  console.log(`  POST   /api/logs`);
  console.log(`  GET    /api/logs`);
  console.log(`  DELETE /api/logs/cleanup/:days`);
  console.log(`  DELETE /api/logs/before/:isoDate`);
  console.log(`  GET    /api/health`);
});

