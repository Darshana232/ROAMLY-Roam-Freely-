import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../modules/auth/user.model.js';
import { COOKIE } from '../modules/auth/auth.controller.js';

async function userFromRequest(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    // Re-load the user so a deleted account's token stops working immediately.
    return await User.findById(sub);
  } catch {
    return null;
  }
}

// Authentication: who are you? Rejects anonymous requests with 401.
export async function requireAuth(req, res, next) {
  req.user = await userFromRequest(req);
  if (!req.user) throw new AppError(401, 'Please log in to continue');
  next();
}

// For routes that work for everyone but personalise for logged-in users.
export async function optionalAuth(req, res, next) {
  req.user = await userFromRequest(req);
  next();
}
