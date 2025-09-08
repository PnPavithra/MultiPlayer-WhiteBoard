const express = require('express');
const app = express();

const http = require('http');

const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res)=>{
    res.send("Whiteboard server is running!");
});

io.on('connection', (socket)=>{
    console.log("A user connected:", socket.id);

    socket.on('disconnect', () => {
        console.log("user disconneted:", socket.id);
    });

    socket.on("draw:begin", (data)=>{
        socket.broadcast.emit("draw:begin", {userId: socket.id, ...data});
    });

    socket.on("draw:point", (data)=>{
        socket.broadcast.emit("draw:point", {userId: socket.id, ...data});
    });

    socket.on("draw:end", (data)=>{
        socket.broadcast.emit("draw:end",({userId: socket.id}));
    });

    socket.on("clear", ()=>{
        socket.broadcast.emit("clear");
    });
});

const PORT = 3000;
server.listen(PORT, ()=>{
    console.log("server is running");
});