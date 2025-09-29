const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.get("/", (req, res) => res.send("✅ Socket.IO server running"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Rooms dictionary
const rooms = {};

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join room
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`🔹 ${socket.id} joined room ${roomId}`);

    // Notify others
    socket.to(roomId).emit("new-participant", socket.id);
  });

  // Relay WebRTC signaling
  socket.on("signal", (data) => {
    const { roomId, to } = data;

    if (to) {
      // Direct message
      io.to(to).emit("signal", { ...data, from: socket.id });
    } else if (roomId) {
      // Broadcast to all in room except sender
      socket.to(roomId).emit("signal", { ...data, from: socket.id });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
