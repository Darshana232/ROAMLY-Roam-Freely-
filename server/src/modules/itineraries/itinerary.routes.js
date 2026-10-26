import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './itinerary.controller.js';

const router = Router();

// Drafting and previewing are open so people can plan before signing up.
router.get('/draft', validate({ query: c.draftQuery }), c.draft);
router.post('/preview', validate({ body: c.previewBody }), c.preview);

router.use(requireAuth);
router.get('/', c.mine);
router.post('/', validate({ body: c.createBody }), c.create);
router.get('/:id', validate({ params: c.idParams }), c.getOne);
router.patch('/:id', validate({ params: c.idParams, body: c.updateBody }), c.update);
router.delete('/:id', validate({ params: c.idParams }), c.remove);

export default router;
