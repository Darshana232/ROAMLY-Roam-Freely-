import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { seed } from '../src/seed/seed.js';

let mongo;

export async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('roamly-test'));
  await seed();
  // Unique indexes must exist before the race-condition tests run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongo.stop();
}

let counter = 0;

// Registers a fresh user and returns a supertest agent that keeps its cookie.
export async function newUser(overrides = {}) {
  const agent = request.agent(app);
  counter += 1;
  const body = {
    name: `Tester ${counter}`,
    email: `tester${counter}-${Date.now()}@example.com`,
    password: 'correct-horse-battery',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, body };
}

export const api = () => request(app);

export function isoDay(offset) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
