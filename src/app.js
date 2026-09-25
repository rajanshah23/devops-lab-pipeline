const express = require("express");
const client = require("prom-client");
const app = express();
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "nodejs_" });

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.path,
      status: res.statusCode,
    };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
});

let tasks = [];
let nextId = 1;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/ready", (_req, res) => {
  res.status(200).json({ status: "ready" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/api/tasks", (_req, res) => res.json(tasks));

app.post("/api/tasks", (req, res) => {
  const { title } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }
  const task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return res.status(404).json({ error: "task not found" });
  tasks.splice(index, 1);
  res.status(204).end();
});

app.__reset = () => {
  tasks = [];
  nextId = 1;
};

module.exports = app;
