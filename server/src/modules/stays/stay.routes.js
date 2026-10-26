import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './stay.controller.js';

const router = Router();

router.get('/', validate({ query: c.listQuery }), c.list);
router.get('/:id', validate({ params: c.idParams, query: c.priceQuery }), c.getOne);
router.get('/:id/eligibility', requireAuth, validate({ params: c.idParams }), c.eligibility);
router.post('/:id/reviews', requireAuth, validate({ params: c.idParams, body: c.reviewBody }), c.addReview);

export default router;
