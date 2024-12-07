import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client
      .on('error', (err) => console.log(err.message));
  }

  isAlive() {
    if (!this.client.connected) {
      return true;
    }
    return false;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    const promise = getAsync(key);
    return promise;
  }

  async set(key, value, duration) {
    this.client.set(key, value, 'EX', duration);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
