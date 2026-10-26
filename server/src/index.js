import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { app } from './app.js';

const inMemory = await connectDB();

if (inMemory) {
  const { seed } = await import('./seed/seed.js');
  await seed();
}

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
