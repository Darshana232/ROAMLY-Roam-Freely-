import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { isProd } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.originalUrl} not found` } });
}

// Single place that turns any thrown error into a consistent JSON shape:
// { error: { message, details? } }. Express 5 forwards rejected promises from
// async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: { message: 'Invalid input', details } });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: { message: `Invalid ${err.path}` } });
  }

  // Duplicate key, e.g. registering an email that already exists.
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    return res.status(409).json({ error: { message: `That ${field} is already in use` } });
  }

  console.error(err);
  res.status(500).json({ error: { message: isProd ? 'Something went wrong' : err.message } });
}
