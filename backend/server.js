const express = require('express');
const app = express();
const mongoose = require('mongoose');
const StrokeDB = require('./models/StrokeDB');
require("dotenv").config(); 

const http = require('http');

const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

mongoose.connect("mongodb+srv://4kWhiteboardUser:4kUser@multiplayerwhiteboard.wohjytq.mongodb.net/?retryWrites=true&w=majority&appName=MultiplayerWhiteboard")
.then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("MongoDB connection error: ", err));

app.get('/', (req, res)=>{
    res.send("Whiteboard server is running!");
});

app.get("/strokes", async (req, res) => {
    try {
        const strokes = await StrokeDB.find({ undone: false });
        res.json(strokes);
    } catch (err) {
        res.status(500).json({ error: "Failed to load strokes" });
    }
});

// --- Socket.IO ---
io.on("connection", async (socket) => {
    console.log("New client connected:", socket.id);

    // Send all active strokes to new client
    const strokes = await StrokeDB.find({ undone: false });
    socket.emit("load:strokes", strokes);

    // --- Draw events ---
    socket.on("draw:begin", (data) => {
        socket.broadcast.emit("draw:begin", { userId: socket.id, ...data });
    });

    socket.on("draw:point", (data) => {
        socket.broadcast.emit("draw:point", { userId: socket.id, ...data });
    });

    socket.on("draw:end", async (data) => {
        const newStroke = new StrokeDB({
            userId: socket.id,
            id: data.id,
            tool: data.tool,
            color: data.color,
            size: data.size,
            points: data.points,
            undone: false
        });

        await newStroke.save();
        socket.broadcast.emit("draw:end", { userId: socket.id, ...data });
    });

    // --- Undo ---
    socket.on("draw:undo", async ({ id }) => {
        await StrokeDB.updateOne({ id }, { $set: { undone: true } });
        socket.broadcast.emit("draw:undo", { id });
    });

    // --- Redo ---
    socket.on("draw:redo", async (stroke) => {
        await StrokeDB.updateOne({ id: stroke.id }, { $set: { undone: false } });
        socket.broadcast.emit("draw:redo", stroke);
    });

    // --- Clear ---
    socket.on("clear", async () => {
        await StrokeDB.updateMany({}, { $set: { undone: true } });
        socket.broadcast.emit("clear");
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});


// io.on('connection', async (socket)=>{
//     console.log("A user connected:", socket.id);


//     const pastStrokes = await StrokeDB.find({ undone: false});
//     socket.emit("load:strokes", pastStrokes);

//     socket.on('disconnect', () => {
//         console.log("user disconneted:", socket.id);
//     });


//     socket.on("draw:begin", (data)=>{
//         socket.broadcast.emit("draw:begin", {userId: socket.id, ...data});
//     });


//     socket.on("draw:point", (data)=>{
//         socket.broadcast.emit("draw:point", {userId: socket.id, ...data});
//     });


//     socket.on("draw:end", async (data)=>{
//         const newStroke = new StrokeDB({
//             userId: socket.id,
//             tool: data.tool,
//             color: data.color,
//             size: data.size,
//             points: data.points,
//             id: data.id
//         });
        
//         await newStroke.save();
//         socket.broadcast.emit("draw:end",({userId: socket.id, ...data}));
//     });

//     socket.on("draw:undo", async ({ id })=>{
//             await StrokeDB.updateOne({ id, userId: socket.id }, { $set: { undone: true } });
//             socket.broadcast.emit("draw:undo", { userId: socket.id, id });
//     });

//     socket.on("draw:redo", async (stroke)=>{
//         await StrokeDB.updateOne({ id: stroke.id, userId: socket.id }, { $set: { undone: false }});
//         socket.broadcast.emit("draw:redo", { userId: socket.id, stroke });
        
//     });

//     socket.on("clear", async ()=>{
//         await StrokeDB.deleteMany({});
//         socket.broadcast.emit("clear");
//     });
// });

const PORT = 3000;
server.listen(PORT, ()=>{
    console.log("server is running");
});