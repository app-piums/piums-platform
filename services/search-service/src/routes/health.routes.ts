import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'search-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
