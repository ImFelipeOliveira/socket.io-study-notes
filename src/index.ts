import express from "express";
import { config } from "dotenv";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";
import { database } from "./database/sqlite-database";

async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  config();

  const PORT = process.env.PORT || 8000;
  const db = await database();

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
  });

  io.on("connection", async (socket) => {
    console.log("user connected");
    socket.on("chat message", async (msg) => {
      try {
        const result = await db.run(
          "INSERT INTO messages (content) VALUES (?)",
          msg
        );

        io.emit("chat message", msg, result.lastID);
      } catch (error) {
        return console.error("Error inserting message:", error);
      }
    });

    if (!socket.recovered) {
      try {
        const messages: { id: string; content: string; client_offset: string } =
          await db.all("SELECT id, content FROM messages WHERE id > ?", [
            socket.handshake.auth.serverOffset || 0,
          ]);

        socket.emit("messages", messages.content, messages.id);
      } catch (error) {
        console.error("Error recovering connection:", error);
        return socket.emit("error", "Error recovering connection");
      }
    }
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
main();
