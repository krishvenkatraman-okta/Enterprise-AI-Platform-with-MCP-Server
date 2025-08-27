// Vercel serverless function for handling API routes
import express from 'express';
import session from 'express-session';
import { storage } from '../server/storage.js';
import { mcpServer } from '../server/mcp-server.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Vercel
app.use(session({
  secret: process.env.SESSION_SECRET || 'demo-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Import and mount routes
import('./routes.js').then(({ registerRoutes }) => {
  registerRoutes(app);
});

// Mount MCP server
app.use(mcpServer);

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;