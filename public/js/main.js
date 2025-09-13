import { BrushSettings } from "./brushSettings.js";
import { CanvasManager } from "./canvasManager.js";
import { NetworkManager } from "./networkManager.js";
import { ToolManager } from "./toolManager.js";

const socket = io("http://localhost:3000");
const network = new NetworkManager(socket);

const roomId = window.location.pathname.split("/room/")[1];

socket.on("connect", () => {
    console.log("connected to server:", socket.id, "joining room: ", roomId);
    network.userId = socket.id;
    socket.emit("joinRoom", roomId);
});

const brushSettings = new BrushSettings("colorPicker", "brushSize");
const toolManager = new ToolManager(brushSettings);
const canvasManager = new CanvasManager("board", brushSettings, toolManager, network);

const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const eraserBtn = document.getElementById("eraserBtn");
const penBtn = document.getElementById("penBtn");

clearBtn.addEventListener("click", ()=>{
    canvasManager.clearCanvas();
    network.emit("clear");
});

saveBtn.addEventListener("click", ()=>{
    canvasManager.saveImage();
});

penBtn.addEventListener("click", () => {
    toolManager.usePen();
});

eraserBtn.addEventListener("click", ()=>{
    toolManager.useEraser();
});

const colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("input", () => {
    toolManager.updatePenSettings();
})

const brushSize = document.getElementById("brushSize");
brushSize.addEventListener("input", () => {
    toolManager.updatePenSettings();
});

const undoBtn = document.getElementById("undo");
undoBtn.addEventListener("click", ()=>{
    canvasManager.undo();
});

const redoBtn = document.getElementById("redo");
redoBtn.addEventListener("click", ()=>{
    canvasManager.redo();
});

window.brush = brushSettings;
window.canvas = canvasManager;
window.tool = toolManager;