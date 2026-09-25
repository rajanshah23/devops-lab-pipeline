const app = require('./app.js');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', msg: `listening on :${PORT}` }));
});


function shutdown(signal) {
  console.log(JSON.stringify({ level: 'info', msg: `${signal} received, draining` }));
  server.close(() => {
    console.log(JSON.stringify({ level: 'info', msg: 'closed' }));
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));