import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

// Mount route modules
router.use('/health', healthRoutes);

// API routes placeholder
router.use('/api/v1', (req, res) => {
  res.json({
    message: 'API v1 endpoint',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
