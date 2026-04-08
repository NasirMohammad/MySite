const http = require("http");

const PORT = 5000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Hello from Node App 2 🚀 on port 5000");
});

server.listen(PORT);
