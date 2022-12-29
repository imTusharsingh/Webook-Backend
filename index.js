const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv').config();
const morgan = require("morgan")
const path = require("path")


const app = express();

const PORT = process.env.PORT || 4000;

//Data-base connection
require("./DB/connect");

//cors
app.use(cors())

app.use(morgan('dev'))

app.use("/uploads", express.static('uploads'));

//body-parsing
app.use(express.urlencoded({ extended: false }))
app.use(express.json())



//User-Routes
app.use("/", require("./Routes/UserRoute"))
//friend-Routes
app.use("/", require("./Routes/FrinedRoute"))
//Post-Routes
app.use("/", require("./Routes/PostRoute"))
//like-Routes
app.use("/", require("./Routes/likeRoute"))
//comment-Routes
app.use("/", require("./Routes/commentRoute"))
//conversation-Routes
app.use("/", require("./Routes/conversationroute"))
//message-Routes
app.use("/", require("./Routes/messageRoute"))


//--------------------deployment-----------------------//

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
    const path = require("path");
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    })
} else {
    app.get('/', (req, res) => {
        res.send('API is running...')
    })
}



//--------------------deployment-----------------------//

const server = app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`)
})

const io = require("socket.io")(server, {
    cors: {
        origin: "https://webook-frontend.onrender.com",
    },
});

let users = [];

const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    //when connect
    console.log("a user connected.", users, socket.id);

    //take userId and socketId from user
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        console.log(users)
        io.emit("getUsers", users);
    });


    //send and get message
    socket.on("sendMessage", ({ text, conversationId, reciever }) => {
        console.log(users, reciever)

        const user = getUser(reciever._id);
        console.log(user)
        io.to(user?.socketId).emit("getMessage", {
            text,
            conversationId,
            reciever
        });
    });

    //when disconnect
    socket.on("disconnect", () => {
        console.log("a user disconnected!");
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
});

