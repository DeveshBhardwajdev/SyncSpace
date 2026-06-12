import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  // Start a temporary MongoDB instance in memory
  const mongoServer = await MongoMemoryServer.create();
  
  // Store the URI so test files can connect to it
  process.env.MONGO_URI = mongoServer.getUri();
  
  // Store the server instance so globalTeardown can shut it down
  (global as any).__MONGOSERVER__ = mongoServer;
}