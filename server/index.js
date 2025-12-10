const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: String.raw`H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping\.env.local` });

// Import routes
const mappingsRoutes = require('./routes/mappings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/mappings', mappingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/mappings`);
  console.log(`  POST   /api/mappings`);
  console.log(`  PUT    /api/mappings/:rowNum`);
  console.log(`  DELETE /api/mappings/:rowNum`);
  console.log(`  GET    /api/health`);
});
