export default async function globalTeardown() {
  // Retrieve the MongoDB instance we stored in globalSetup
  const mongoServer = (global as any).__MONGOSERVER__;
  
  // Shut it down cleanly — this destroys all test data permanently
  if (mongoServer) {
    await mongoServer.stop();
  }
}