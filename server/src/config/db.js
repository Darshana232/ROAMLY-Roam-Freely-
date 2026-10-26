import mongoose from 'mongoose';
import { env } from './env.js';

// In development with no MONGO_URI, spin up a throwaway in-memory MongoDB so
// the app runs with zero setup. Returns true when that happened, so the caller
// knows the database starts empty and needs seeding.
export async function connectDB() {
  let uri = env.MONGO_URI;
  let inMemory = false;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const server = await MongoMemoryServer.create();
    uri = server.getUri('roamly');
    inMemory = true;
    console.log('No MONGO_URI set, using in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return inMemory;
}
