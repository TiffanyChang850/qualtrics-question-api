import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {

  const keys = await redis.keys("count:*");

  const counts = {};

  for (const key of keys) {
    counts[key.replace("count:", "")] =
      await redis.get(key);
  }

  res.status(200).json(counts);
}
