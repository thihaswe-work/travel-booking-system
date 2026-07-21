import { Router } from 'express';
import { searchAll } from './search.controller';
import { searchLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.get('/', searchLimiter, searchAll);

export default router;
