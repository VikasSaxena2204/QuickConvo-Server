const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
require("dotenv").config();

const socket = require("socket.io");
const DB = process.env.DB;

app.use(cors({origin: 'https://quick-convo-frontend.vercel.app'}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


mongoose.set('strictQuery', true);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB (cloud)")
}).catch((err) => {
    console.log("Error!!!")
    console.log(err)
})


// mongoose.connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => {
//     console.log("Connected to MongoDB")
// }).catch((err) => {
//     console.log("Error!!!")
//     console.log(err)
// })

const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT ${process.env.PORT}`)
});

server.prependListener("request", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
});

app.get('/', (req, res) => {
    res.send('Hello World!, Server is running.')
});

const io = socket(server, {
  cors: {
    origin: "https://quick-convo-frontend.vercel.app",
    credentials: true,
  },
});


global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
