// server.js
const express = require('express');
const app = express();
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

app.get('/', (req, res) => 
{
    res.send("Whiteboard server is running!");
});

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

io.on("connection", async (socket) => 
{
    console.log("New client connected:", socket.id);

    const strokes = await StrokeDB.find({ undone: false });
    socket.emit("load:strokes", strokes);

    socket.on("draw:begin", (data) => 
    {
        socket.broadcast.emit("draw:begin", { userId: socket.id, ...data });
    });

    socket.on("draw:point", (data) => 
    {
        socket.broadcast.emit("draw:point", { userId: socket.id, ...data });
    });

    socket.on("draw:end", async (data) => 
    {
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

    socket.on("draw:undo", async ({ id }) => 
    {
        await StrokeDB.updateOne({ id }, { $set: { undone: true } });
        socket.broadcast.emit("draw:undo", { id });
    });

    socket.on("draw:redo", async (stroke) => 
    {
        await StrokeDB.updateOne({ id: stroke.id }, { $set: { undone: false } });
        socket.broadcast.emit("draw:redo", stroke);
    });

    socket.on("clear", async () => 
    {
        await StrokeDB.updateMany({}, { $set: { undone: true } });
        socket.broadcast.emit("clear");
    });

    socket.on("disconnect", () => 
    {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});
