const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const dotenv = require("dotenv");
const socket = require("socket.io");

dotenv.config();
const app = express();

const DB = process.env.DB;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

mongoose.set('strictQuery', true);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB (cloud)");
}).catch((err) => {
    console.error("MongoDB connection error:", err.message);
});

const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT ${process.env.PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!, Server is running.');
});

const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;

    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("sendMessage", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("receiveMessage", data.msg);
        }
    });
});
