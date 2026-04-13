const http = require("http");

const PORT = process.env.APP_PORT || 3000;
const NAME = process.env.APP_NAME || "App";

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(`Hello Nasir How Are You??  This from FEATURE branch 🚀`);
});

server.listen(PORT);
