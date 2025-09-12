// import { StrokeManager } from "./strokeManager.js";

// export class CanvasManager {
//     constructor(canvasId, brushSettings, toolManager, network) {
//         this.canvas = document.getElementById(canvasId);
//         this.ctx = this.canvas.getContext("2d");

//         this.brushSettings = brushSettings;
//         this.toolManager = toolManager;
//         this.network = network;

//         this.strokeManager = new StrokeManager(this.ctx, 20);
//         this.currentStroke = null;
//         this.remoteStrokes = {};
//         this.drawing = false;

//         this.resizeCanvas();
//         window.addEventListener("resize", () => {
//             this.resizeCanvas();
//             this.strokeManager.redraw();
//         });

//         this.setupEvents();
//         this.setupNetworkEvents();
//     }

//     resizeCanvas() {
//         this.canvas.width = window.innerWidth;
//         this.canvas.height = window.innerHeight;
//         this.ctx.fillStyle = "white";
//         this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//     }

//     setupEvents() {
//         this.canvas.addEventListener("pointerdown", (e) => this.startDrawing(e));
//         this.canvas.addEventListener("pointermove", (e) => this.draw(e));
//         this.canvas.addEventListener("pointerup", () => this.stopDrawing());
//         this.canvas.addEventListener("pointerleave", () => this.stopDrawing());
//         this.canvas.style.touchAction = "none";
//     }

//     setupNetworkEvents() {
//         this.network.on("draw:begin", ({ userId, tool, color, size, clientX, clientY }) => {
//             const x = clientX / this.canvas.width;
//             const y = clientY / this.canvas.height;
//             this.remoteStrokes[userId] = { tool, color, size, points: [{ x: x * this.canvas.width, y: y * this.canvas.height }] };
//             this.ctx.beginPath();
//             this.ctx.moveTo(x * this.canvas.width, y * this.canvas.height);
//         });

//         this.network.on("draw:point", ({ userId, x, y }) => {
//             const stroke = this.remoteStrokes[userId];
//             if (!stroke) return;

//             const px = x * this.canvas.width;
//             const py = y * this.canvas.height;

//             stroke.points.push({ x: px, y: py });
//             this.ctx.lineTo(px, py);
//             this.ctx.strokeStyle = stroke.color;
//             this.ctx.lineWidth = stroke.size;
//             this.ctx.lineCap = "round";
//             this.ctx.lineJoin = "round";
//             this.ctx.stroke();

//             this.ctx.beginPath();
//             this.ctx.moveTo(px, py);
//         });

//         this.network.on("draw:end", ({ userId, id, tool, color, size, points }) => {
//             const stroke = { id, tool, color, size, points, userId };
//             this.strokeManager.addStroke(stroke);
//             delete this.remoteStrokes[userId];
//         });

//         this.network.on("load:strokes", (strokes) => {
//             for (const stroke of strokes) this.strokeManager.addStroke(stroke);
//             this.strokeManager.redraw();
//         });

//         this.network.on("clear", () => this.clearCanvas());

//         // NETWORK UNDO: remove stroke visually only
//         this.network.on("draw:undo", ({ id }) => {
//             const stroke = this.strokeManager.findStrokeById(id);
//             if (stroke) {
//                 this.strokeManager.removeStroke(id);
//             }
//         });

//         // For receiving redo from remote users
//         this.network.on("draw:redo", ({ userId, stroke }) => {
//             // Add the redone stroke to remote canvas
//             this.strokeManager.addStroke(stroke);
//         });


//     }

//     startDrawing(e) {
//         this.drawing = true;
//         this.canvas.setPointerCapture(e.pointerId);

//         this.toolManager.updatePenSettings();

//         const tool = this.toolManager.activeTool;
//         const color = this.toolManager.getToolColor();
//         const size = this.toolManager.getToolSize();

//         this.currentStroke = {
//             id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
//             userId: this.network.userId,
//             tool,
//             color,
//             size,
//             points: []
//         };

//         this.ctx.beginPath();
//         this.ctx.moveTo(e.clientX, e.clientY);
//         this.currentStroke.points.push({ x: e.clientX, y: e.clientY });

//         this.network.emit("draw:begin", {
//             id: this.currentStroke.id,
//             userId: this.currentStroke.userId,
//             tool,
//             color,
//             size,
//             x: e.clientX / this.canvas.width,
//             y: e.clientY / this.canvas.height
//         });
//     }

//     draw(e) {
//         if (!this.drawing || !this.currentStroke) return;
//         const point = { x: e.clientX, y: e.clientY };
//         this.currentStroke.points.push(point);

//         this.ctx.lineTo(point.x, point.y);
//         this.ctx.strokeStyle = this.currentStroke.color;
//         this.ctx.lineWidth = this.currentStroke.size;
//         this.ctx.lineCap = "round";
//         this.ctx.lineJoin = "round";
//         this.ctx.stroke();

//         this.ctx.beginPath();
//         this.ctx.moveTo(point.x, point.y);

//         this.network.emit("draw:point", { x: e.clientX / this.canvas.width, y: e.clientY / this.canvas.height });
//     }

//     stopDrawing() {
//         if (this.drawing && this.currentStroke) {
//             this.strokeManager.addStroke(this.currentStroke);

//             this.network.emit("draw:end", {
//                 id: this.currentStroke.id,
//                 userId: this.currentStroke.userId,
//                 tool: this.currentStroke.tool,
//                 color: this.currentStroke.color,
//                 size: this.currentStroke.size,
//                 points: this.currentStroke.points
//             });
//         }

//         this.drawing = false;
//         this.currentStroke = null;
//     }

//     undo() {
//         const history = this.strokeManager.ensureUserId(this.network.userId);
//         const lastStroke = history.undo();
//         if (lastStroke) {
//             this.strokeManager.redraw();
//             this.network.emit("draw:undo", { id: lastStroke.id });
//         }
//     }

//     redo() {
//         const history = this.strokeManager.ensureUserId(this.network.userId);
//         const stroke = history.redo();

//         if (stroke) {
//             this.strokeManager.redraw();
//             // Broadcast the full stroke to other clients
//             this.network.emit("draw:redo", { userId: this.network.userId, stroke });
//         }
//     }


//     clearCanvas() {
//         this.strokeManager.clear();
//         this.network.emit("clear");
//     }

//     saveImage() {
//         const link = document.createElement("a");
//         link.download = "whiteBoard.png";
//         link.href = this.canvas.toDataURL("image/png");
//         link.click();
//     }
// }


import { StrokeManager } from "./strokeManager.js";

export class CanvasManager {
    constructor(canvasId, brushSettings, toolManager, network) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.brushSettings = brushSettings;
        this.toolManager = toolManager;
        this.network = network;

        this.strokeManager = new StrokeManager(this.ctx, 50); // max strokes
        this.currentStroke = null;
        this.remoteStrokes = {};
        this.drawing = false;

        this.resizeCanvas();
        window.addEventListener("resize", () => {
            this.resizeCanvas();
            this.strokeManager.redraw();
        });

        this.setupEvents();
        this.setupNetworkEvents();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEvents() {
        this.canvas.addEventListener("pointerdown", e => this.startDrawing(e));
        this.canvas.addEventListener("pointermove", e => this.draw(e));
        this.canvas.addEventListener("pointerup", () => this.stopDrawing());
        this.canvas.addEventListener("pointerleave", () => this.stopDrawing());
        this.canvas.style.touchAction = "none";
    }

    setupNetworkEvents() {
        // --- Remote stroke begins ---
        this.network.on("draw:begin", ({ userId, tool, color, size, clientX, clientY }) => {
            const x = clientX * this.canvas.width;
            const y = clientY * this.canvas.height;

            this.remoteStrokes[userId] = {
                tool, color, size,
                points: [{ x, y }]
            };
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        });

        // --- Remote stroke moves ---
        this.network.on("draw:point", ({ userId, x, y }) => {
            const stroke = this.remoteStrokes[userId];
            if (!stroke) return;

            const px = x * this.canvas.width;
            const py = y * this.canvas.height;

            stroke.points.push({ x: px, y: py });
            this.ctx.lineTo(px, py);
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
        });

        // --- Remote stroke ends ---
        this.network.on("draw:end", ({ userId, id, tool, color, size, points }) => {
            const stroke = { id, tool, color, size, points, userId };
            this.strokeManager.addStroke(stroke);
            delete this.remoteStrokes[userId];
        });

        // --- Load persisted strokes ---
        this.network.on("load:strokes", strokes => {
            for (const stroke of strokes) this.strokeManager.addStroke(stroke);
            this.strokeManager.redraw();
        });

        // --- Remote undo ---
        this.network.on("draw:undo", ({ id }) => {
            this.strokeManager.removeStroke(id);
        });

        // --- Remote redo ---
        this.network.on("draw:redo", stroke => {
            this.strokeManager.addStroke(stroke);
        });

        // --- Remote clear ---
        this.network.on("clear", () => {
            this.strokeManager.clear();
        });
    }

    startDrawing(e) {
        this.drawing = true;
        this.canvas.setPointerCapture(e.pointerId);

        this.toolManager.updatePenSettings();
        const tool = this.toolManager.activeTool;
        const color = this.toolManager.getToolColor();
        const size = this.toolManager.getToolSize();

        this.currentStroke = {
            id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
            userId: this.network.userId,
            tool, color, size,
            points: []
        };

        this.ctx.beginPath();
        this.ctx.moveTo(e.clientX, e.clientY);
        this.currentStroke.points.push({ x: e.clientX, y: e.clientY });

        this.network.emit("draw:begin", {
            id: this.currentStroke.id,
            tool, color, size,
            clientX: e.clientX / this.canvas.width,
            clientY: e.clientY / this.canvas.height
        });
    }

    draw(e) {
        if (!this.drawing || !this.currentStroke) return;

        const point = { x: e.clientX, y: e.clientY };
        this.currentStroke.points.push(point);

        this.ctx.lineTo(point.x, point.y);
        this.ctx.strokeStyle = this.currentStroke.color;
        this.ctx.lineWidth = this.currentStroke.size;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);

        this.network.emit("draw:point", {
            x: e.clientX / this.canvas.width,
            y: e.clientY / this.canvas.height
        });
    }

    stopDrawing() {
        if (this.drawing && this.currentStroke) {
            this.strokeManager.addStroke(this.currentStroke);

            this.network.emit("draw:end", {
                id: this.currentStroke.id,
                tool: this.currentStroke.tool,
                color: this.currentStroke.color,
                size: this.currentStroke.size,
                points: this.currentStroke.points
            });
        }
        this.drawing = false;
        this.currentStroke = null;
    }

    undo() {
        const stroke = this.strokeManager.undo(this.network.userId);
        if (stroke) this.network.emit("draw:undo", { id: stroke.id });
    }

    redo() {
        const stroke = this.strokeManager.redo(this.network.userId);
        if (stroke) this.network.emit("draw:redo", stroke);
    }

    clearCanvas() {
        this.strokeManager.clear();
        this.network.emit("clear");
    }

    saveImage() {
        const link = document.createElement("a");
        link.download = "whiteboard.png";
        link.href = this.canvas.toDataURL("image/png");
        link.click();
    }
}