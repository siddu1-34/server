import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

// Generate a new room ID
app.get("/create-room", (req, res) => {
  const roomId = uuidv4();
  rooms[roomId] = [];
  res.json({ roomId });
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("new-participant", socket.id);
  });

  socket.on("signal", (data) => {
    const { to } = data;
    if (to) io.to(to).emit("signal", { ...data, from: socket.id });
    else io.to(data.roomId).emit("signal", { ...data, from: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("participant-left", socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Signaling server running on port", PORT));
