import { Router } from 'express';
import healthRoutes from './health';
import userRoutes from './user';

const router = Router();

// Mount route modules
router.use('/health', healthRoutes);

// Mount user route modules
router.use('/api/v1/user', userRoutes)

// API routes placeholder
router.use('/api/v1', (req, res) => {
  res.json({
    message: 'API v1 endpoint',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
