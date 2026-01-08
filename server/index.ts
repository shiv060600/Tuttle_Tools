import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

// load env
dotenv.config();

// routes
import mappingsRoutes from './routes/mappings';
import loggingRoutes  from './routes/logger';
import bookRoutes from './routes/books';
import authRoutes from './routes/auth';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true only with HTTPS
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax', // CSRF protection, works with both same-site and cross-site
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://tutpub2.tuttlepub.com:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());

// Request logging - must come before routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/api/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/mappings', mappingsRoutes);
app.use('/api/logging', loggingRoutes);
app.use('/api/books', bookRoutes);


//error handlers are after routes in the order they should be accessed
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
app.listen(PORT, '0.0.0.0', (): void => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(` Server running on http://0.0.0.0:${PORT} (accessible on network)`);
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
  console.log(` Books: `);
  console.log(` GET /api/books/:bookId
    
    `)
  console.log(`${'='.repeat(50)}\n`);
});

