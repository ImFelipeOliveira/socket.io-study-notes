import express from "express";
import { config } from "dotenv";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);
config();

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
