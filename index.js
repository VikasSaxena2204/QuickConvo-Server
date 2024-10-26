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

// Enable CORS for your frontend URL
app.use(cors({ 
    origin: 'http://localhost:3000', 
    credentials: true 
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

mongoose.set('strictQuery', true);

// Connect to MongoDB
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB (cloud)");
}).catch((err) => {
    console.error("MongoDB connection error:", err.message);
});

// Create the server and set it to listen on the specified port
const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT ${process.env.PORT}`);
});

// Basic route for testing server
app.get('/', (req, res) => {
    res.send('Hello World! Server is running.');
});

// Set up Socket.IO with the server
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"], 
        credentials: true 
    },
});

// Create a map to keep track of online users
global.onlineUsers = new Map();

// Handle Socket.IO connections
io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);
    global.chatSocket = socket;

    // Add user to online users when they connect
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User added: ${userId} with socket ID: ${socket.id}`);
    });

    // Handle message sending
    socket.on("sendMessage", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("receiveMessage", data.msg);
            console.log(`Message sent to ${data.to}: ${data.msg}`);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                onlineUsers.delete(key);
                console.log(`User removed: ${key}`);
            }
        });
    });
});
