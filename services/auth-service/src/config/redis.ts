import Redis from "ioredis";

// Create a single Redis connection using the REDIS_URL from our .env file
// ioredis automatically handles reconnection if the connection drops
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // If Redis is unavailable, retry connecting every 2 seconds
  retryStrategy(times) {
    const delay = Math.min(times * 2000, 10000); // max 10 second wait
    console.log(`Redis: retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
  // Give up retrying after 10 failed attempts
  maxRetriesPerRequest: 3,
});

// Log when we successfully connect
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Log if connection is lost
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

export default redis;