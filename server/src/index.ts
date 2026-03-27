import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenants';
import campaignTypeRoutes from './routes/campaignTypes';
import campaignRoutes from './routes/campaigns';
import statsRoutes from './routes/stats';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mateker';

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes
app.use('/api/auth', authRoutes);

// All routes below require a valid JWT
app.use('/api/tenants', requireAuth, tenantRoutes);
app.use('/api/campaign-types', requireAuth, campaignTypeRoutes);
app.use('/api/campaigns', requireAuth, campaignRoutes);
app.use('/api/stats', requireAuth, statsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
