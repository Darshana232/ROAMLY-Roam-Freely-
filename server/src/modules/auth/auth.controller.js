import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env, isProd } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { GENDERS, User } from './user.model.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.email('Enter a valid email').transform((e) => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  gender: z.enum(GENDERS).optional(),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email').transform((e) => e.toLowerCase()),
  password: z.string().min(1, 'Enter your password'),
});

export const COOKIE = 'roamly_token';

// The frontend proxies /api through its own domain (see client/vercel.json),
// so the cookie is first-party and SameSite=Lax works in every browser.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function setSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.cookie(COOKIE, token, cookieOptions);
}

export async function register(req, res) {
  const { name, email, password, gender } = req.body;
  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, gender });
  setSession(res, user);
  res.status(201).json({ user: user.toPublic() });
}

// Compared against when the email doesn't exist, so a login attempt takes the
// same time either way and can't be used to discover registered emails.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Email or password is incorrect');

  setSession(res, user);
  res.json({ user: user.toPublic() });
}

export function logout(req, res) {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
}

// Answers "who am I?" for everyone: anonymous visitors get { user: null }
// rather than a 401, so checking the session isn't treated as a failure.
export function me(req, res) {
  res.json({ user: req.user ? req.user.toPublic() : null });
}
