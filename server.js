const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
app.use(cors()); 
app.get("/", (req, res) => {
  res.send("✅ Socket.IO server is running");
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  socket.on("signal", (data) => {
    console.log(`📨 Signal: ${data.type} from ${socket.id} to ${data.to}`);
    if (data.to) {
      socket.to(data.to).emit("signal", { ...data, from: socket.id });
    }
  });
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
