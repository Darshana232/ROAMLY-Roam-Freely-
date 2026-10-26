import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import * as c from './trip.controller.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: c.listQuery }), c.list);
router.get('/mine', requireAuth, c.mine);
router.get('/alerts', requireAuth, c.alerts);
router.post('/alerts/seen', requireAuth, c.markAlertsSeen);
router.get('/:id', optionalAuth, validate({ params: c.idParams }), c.getOne);

router.post('/', requireAuth, validate({ body: c.createBody }), c.create);
router.post('/:id/cancel', requireAuth, validate({ params: c.idParams }), c.cancel);
router.post('/:id/requests', requireAuth, validate({ params: c.idParams, body: c.joinBody }), c.requestToJoin);
router.delete('/:id/requests/mine', requireAuth, validate({ params: c.idParams }), c.withdraw);
router.post('/:id/requests/:requestId/approve', requireAuth, validate({ params: c.requestParams }), c.approve);
router.post('/:id/requests/:requestId/reject', requireAuth, validate({ params: c.requestParams }), c.reject);

export default router;
