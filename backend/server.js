const express = require('express');
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const StrokeDB = require('./models/StrokeDB');
require("dotenv").config({ path: "../.env" });

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, 
{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoHost = process.env.MONGO_HOST;
const mongoDB = process.env.MONGO_DB;

if (!mongoUser || !mongoPass || !mongoHost || !mongoDB) 
{
    console.error("Error: Missing MongoDB environment variables in .env");
    process.exit(1);
}

const uri = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoHost}/${mongoDB}?retryWrites=true&w=majority`;

mongoose.connect(uri)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));


//
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/home.html"));
});


//
app.get("/room/:roomId", (req, res) =>
{
    res.sendFile(path.join(__dirname, "../public/index.html"));
});


//
app.use(express.static(path.join(__dirname, "../public")));


//
app.get("/strokes", async (req, res) => 
{
    try 
    {
        const strokes = await StrokeDB.find({ undone: false });
        res.json(strokes);
    } 
    
    catch (err) 
    {
        res.status(500).json({ error: "Failed to load strokes" });
    }
});


//
io.on("connection", async (socket) => 
{
    console.log("New client connected:", socket.id);


    //
    socket.on("joinRoom", async (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        console.log(`User ${socket.id} joined room ${roomId}`);

        const strokes = await StrokeDB.find({ roomId, undone: false });
        socket.emit("load:strokes", strokes);
    });


    //
    socket.on("draw:begin", (data) => 
    {
        if(!socket.roomId) return;
        socket.to(socket.roomId).emit("draw:begin", { userId: socket.id, ...data });
    });


    //
    socket.on("draw:point", (data) => 
    {
        socket.to(socket.roomId).emit("draw:point", { userId: socket.id, ...data });
    });


    //
    socket.on("draw:end", async (data) => 
    {
        const newStroke = new StrokeDB({
            roomId: socket.roomId,
            userId: socket.id,
            id: data.id,
            tool: data.tool,
            color: data.color,
            size: data.size,
            points: data.points,
            undone: false
        });
        await newStroke.save();
        socket.to(socket.roomId).emit("draw:end", { userId: socket.id, ...data });
    });


    //
    socket.on("draw:undo", async ({ id }) => 
    {
        await StrokeDB.updateOne({ id }, { $set: { undone: true } });
        socket.to(socket.roomId).emit("draw:undo", { id });
    });


    //
    socket.on("draw:redo", async (stroke) => 
    {
        await StrokeDB.updateOne({ id: stroke.id }, { $set: { undone: false } });
        socket.to(socket.roomId).emit("draw:redo", stroke);
    });


    //
    socket.on("clear", async () => 
    {
        await StrokeDB.updateMany({ roomId: socket.roomId }, { $set: { undone: true } });
        socket.to(socket.roomId).emit("clear");
    });


    //
    socket.on("disconnect", async () => {
    const roomId = socket.roomId;
    const room = io.sockets.adapter.rooms.get(roomId);

    if (!room || room.size === 0) 
    {
        const checkRoom = io.sockets.adapter.rooms.get(roomId);
        if (!checkRoom || checkRoom.size === 0) 
        {
            await StrokeDB.deleteMany({ roomId });
            console.log(`Deleted strokes for room ${roomId}`);
        }
    }
});

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});