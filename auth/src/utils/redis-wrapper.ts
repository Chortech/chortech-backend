import redis, { RedisClient } from "redis";

class RedisWrapper {
  private _client?: RedisClient;
  private _ttl = 60 * 2; // Time To Live
  private _ttlAfterVerify = 60 * 5; // Time To Live
  get client() {
    if (!this._client) throw new Error("Cannot access redis before connecting");

    return this._client;
  }
  get ttl() {
    return this._ttl;
  }

  get ttlAfterVerify() {
    return this._ttlAfterVerify;
  }

  set ttl(seconds: number) {
    this._ttl = seconds;
  }
  set ttlAfterVerify(seconds: number) {
    this._ttlAfterVerify = seconds;
  }

  connect(host: string) {
    this._client = redis.createClient(host);
    this.client.on("error", (error) => console.log(error));
    this.client.on("connect", function () {
      console.log("connected to redis server.");
    });
  }

  getAsync(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) return reject(err);

        resolve(reply);
      });
    });
  }

  setAsync(key: string, value: string) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err, reply) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  setEXAsync(key: string, value: string, exp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, "EX", exp, (err, reply) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  existsAsync(key: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      this.client.exists(key, (err, result) => {
        if (err) return reject(err);
        resolve(result === 1);
      });
    });
  }

  delAsync(key: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      this.client.del(key, (err, result) => {
        if (err) return reject(err);

        resolve(result === 1);
      });
    });
  }
}

export const redisWrapper = new RedisWrapper();
