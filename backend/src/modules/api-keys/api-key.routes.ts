import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createApiKeySchema, updateApiKeySchema } from './api-key.validation';
import * as apiKeyController from './api-key.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'travel_agent'));

router.post('/', validate({ body: createApiKeySchema }), apiKeyController.create);
router.get('/', apiKeyController.list);
router.put('/:id', validate({ body: updateApiKeySchema }), apiKeyController.update);
router.delete('/:id', apiKeyController.revoke);

export default router;
