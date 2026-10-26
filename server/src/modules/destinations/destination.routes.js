import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { finderQuery, getOne, list, meta, search, slugParams } from './destination.controller.js';

const router = Router();

router.get('/meta', meta);
router.get('/search', validate({ query: finderQuery }), search);
router.get('/', list);
router.get('/:slug', validate({ params: slugParams }), getOne);

export default router;
