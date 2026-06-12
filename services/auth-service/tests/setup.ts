import mongoose from 'mongoose';

beforeEach(async () => {
  // Connect to the in-memory MongoDB before tests in this file run
  await mongoose.connect(process.env.MONGO_URI as string);
});

afterEach(async () => {
  // Clear ALL collections after every single test
  // This ensures tests never affect each other
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Disconnect from MongoDB after all tests in this file finish
  await mongoose.disconnect();
});