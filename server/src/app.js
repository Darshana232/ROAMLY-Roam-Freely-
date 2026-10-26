import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import destinationRoutes from './modules/destinations/destination.routes.js';
import itineraryRoutes from './modules/itineraries/itinerary.routes.js';
import tripRoutes from './modules/trips/trip.routes.js';
import stayRoutes from './modules/stays/stay.routes.js';

export const app = express();

// Requests reach us through proxies (Vercel's rewrite, then Render's load
// balancer). Trusting exactly that many hops gives rate limiting the real
// client IP instead of the proxy's.
app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!isProd) app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, skip: () => env.NODE_ENV === 'test' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/stays', stayRoutes);

app.use(notFound);
app.use(errorHandler);
