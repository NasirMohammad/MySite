const express = require("express");
const amqp = require("amqplib");
const Redis = require("ioredis");
const client = require("prom-client");

const app = express();
const PORT = 3000;

// -----------------------------
// Redis connection (ENV BASED)
// -----------------------------
const redis = new Redis({
  host: process.env.REDIS_HOST || "redis-master.default.svc.cluster.local",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

// -----------------------------
// Prometheus Metrics
// -----------------------------
client.collectDefaultMetrics();

// HTTP request counter
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

// HTTP latency
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

// Redis cache metrics
const cacheHitCounter = new client.Counter({
  name: "redis_cache_hit_total",
  help: "Total number of Redis cache hits",
});

const cacheMissCounter = new client.Counter({
  name: "redis_cache_miss_total",
  help: "Total number of Redis cache misses",
});

// -----------------------------
// Middleware for metrics
// -----------------------------
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: String(res.statusCode),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.path,
        status: String(res.statusCode),
      },
      duration
    );
  });

  next();
});

// -----------------------------
// Routes
// -----------------------------
app.get("/queue", async (req, res) => {
  try {
    const connection = await amqp.connect("amqp://admin:admin123@rabbitmq.default.svc.cluster.local:5672");
    const channel = await connection.createChannel();

    const queue = "jobs";
    const message = {
      task: "send-email",
      createdAt: new Date(),
    };

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    await channel.close();
    await connection.close();

    res.json({
      status: "queued",
      queue,
      message,
    });
  } catch (error) {
    console.error("RabbitMQ error:", error.message);

    res.status(500).json({
      error: "RabbitMQ publish failed",
      details: error.message,
    });
  }
});
// Root
app.get("/", (req, res) => {
  res.send("Hello K8s CI/CD V3 Deployment Success 🚀");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Redis cache API
app.get("/data", async (req, res) => {
  const cacheKey = "data";

  try {
    const cache = await redis.get(cacheKey);

    if (cache) {
      console.log("⚡ CACHE HIT");
      cacheHitCounter.inc();   // 🔥 IMPORTANT

      return res.json({
        source: "cache",
        data: JSON.parse(cache),
      });
    }

    console.log("🐢 CACHE MISS");
    cacheMissCounter.inc();   // 🔥 IMPORTANT

    const data = {
      message: "Hello from server",
      time: new Date(),
    };

    await redis.set(cacheKey, JSON.stringify(data), "EX", 30);
    console.log("💾 CACHE SET DONE");

    return res.json({
      source: "server",
      data,
    });

  } catch (err) {
    console.error("❌ REDIS ERROR:", err.message);

    return res.status(500).json({
      error: "Redis failed",
    });
  }
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Error test route
app.get("/error", (req, res) => {
  console.error("🚨 Test error triggered");
  res.status(500).json({ error: "Test error generated" });
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
