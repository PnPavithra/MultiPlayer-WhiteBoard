import { StrokeManager } from "./strokeManager.js";

export class CanvasManager
{
    constructor(canvasId, brushSettings, toolManager, network)
    {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.brushSettings = brushSettings;
        this.toolManager = toolManager;
        this.network = network;

        this.strokeManager = new StrokeManager(this.ctx);
        this.currentStroke = null;

        this.remoteStrokes = {};

        this.drawing = false;

        this.resizeCanvas();

        window.addEventListener("resize", ()=>
        {
            this.resizeCanvas();
            this.strokeManager.redraw();
        });

        this.setupEvents();
        this.setupNetworkEvents();
    }

    resizeCanvas()
    {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEvents()
    {
        this.canvas.addEventListener("pointerdown", (e)=> this.startDrawing(e));
        this.canvas.addEventListener("pointermove", (e)=>this.draw(e));
        this.canvas.addEventListener("pointerup", ()=> this.stopDrawing());
        this.canvas.addEventListener("pointerleave", ()=> this.stopDrawing());

        this.canvas.style.touchAction = "none";
    }

    setupNetworkEvents()
    {
        this.network.on("draw:begin", ({ userId, tool, color, size, clientX, clientY }) => {
            
            const x = clientX / this.canvas.width;
            const y = clientY / this.canvas.height;
            
            this.remoteStrokes[userId] = 
            {
                tool,
                color,
                size,

                points: [{ x: x*this.canvas.width, y: y*this.canvas.height }]
            };

            this.ctx.beginPath();
            this.ctx.moveTo(x*this.canvas.width, y*this.canvas.height);

        });

        this.network.on("draw:point", ({userId,x, y})=>
        {
            const stroke = this.remoteStrokes[userId];
            if(!stroke) return;

            const px = x*this.canvas.width;
            const py =  y*this.canvas.height;
            stroke.points.push({x: px, y:py});

            this.ctx.lineTo(px, py);
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(px,py);
        });

        this.network.on("draw:end", ({userId, id, tool,color, size, points})=>
        {
            const stroke = {id, tool,color, size, points};

            if(stroke)
            {
                this.strokeManager.addStroke(stroke);
                delete this.remoteStrokes[userId];
            }
        });

        this.network.on("load:strokes", (strokes) => {
            for(const stroke of strokes){
                this.strokeManager.addStroke(stroke);
            }
            this.strokeManager.redraw();
        })

        this.network.on("clear", ()=>
        {
            this.clearCanvas();
        });

        this.network.on("draw:undo", ({ userId, id })=>{
            const index = this.strokeManager.strokes.findIndex( 
                s => s.userId === userId && s.id === id
            );
            if(index !== -1)
            {     
                this.strokeManager.strokes.splice(index, 1);
                this.strokeManager.redraw();
            }
        });

        this.network.on("draw:redo", ({userId, stroke}) =>{
            stroke.userId = userId;
            this.strokeManager.addStroke(stroke);
            this.strokeManager.redraw();
        })
    }

    startDrawing(e)
    {
        this.drawing = true;
        this.canvas.setPointerCapture(e.pointerId);

        this.toolManager.updatePenSettings();

        const tool = this.toolManager.activeTool;
        const color = this.toolManager.getToolColor();
        const size = this.toolManager.getToolSize();

        this.currentStroke = {
            id: Date.now() + "-" + Math.random().toString(36).substr(2,9),
            userId: this.network.userId,
            tool, 
            color,
            size,
            points: []
        };

        this.ctx.beginPath();
        this.ctx.moveTo(e.clientX,e.clientY);
        
        this.currentStroke.points.push({ x: e.clientX, y: e.clientY});

        this.network.emit("draw:begin", 
        {
            id: this.currentStroke.id,
            userId: this.currentStroke.userId,
            tool,
            color,
            size,
            x: e.clientX / this.canvas.width,
            y: e.clientY / this.canvas.height
        });
    }

    draw(e)
    {
        if(!this.drawing || !this.currentStroke) return;

        const point= { x: e.clientX, y: e.clientY };
        this.currentStroke.points.push(point);

        this.ctx.lineTo(point.x, point.y);
        this.ctx.strokeStyle = this.currentStroke.color;
        this.ctx.lineWidth = this.currentStroke.size;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);

        this.network.emit("draw:point", 
        {
            x: e.clientX / this.canvas.width,
            y: e.clientY / this.canvas.height
        });
    }

    stopDrawing()
    {

        if(this.drawing && this.currentStroke)
        {
            this.strokeManager.addStroke(this.currentStroke);
            this.strokeManager.redraw();

            this.network.emit("draw:end", {
                id: this.currentStroke.id,
                userId: this.currentStroke.userId,
                tool: this.currentStroke.tool,
                color: this.currentStroke.color,
                size: this.currentStroke.size,
                points: this.currentStroke.points
            });
        }

        this.drawing = false;
        this.currentStroke = null;
    }

    undo()
    {
        const stroke = this.strokeManager.strokes
            .slice()
            .reverse()
            .find(s => s.userId === this.network.userId);

        if(stroke){
                const index = this.strokeManager.strokes.findIndex(s => s.id === stroke.id);
                if (index !== -1) this.strokeManager.strokes.splice(index, 1);
                
                this.strokeManager.undoStack.push(stroke);
                this.strokeManager.redraw();

                this.network.emit("draw:undo", { userId: this.network.userId, id: stroke.id });
        }
    }

    redo()
    {
        const index = this.strokeManager.undoStack
        .slice()
        .reverse()
        .findIndex(s => s.userId === this.network.userId);
        
        if (index === -1) return;

        const stroke = this.strokeManager.undoStack.splice(
        this.strokeManager.undoStack.length - 1 - index, 1)[0];

        this.strokeManager.strokes.push(stroke);
        this.strokeManager.redraw();

        this.network.emit("draw:redo", { userId: this.network.userId, stroke });
    }

    clearCanvas() 
    {
        this.strokeManager.strokes = [];
        this.strokeManager.redraw();
    }

    saveImage()
    {
        const link = document.createElement("a");
        link.download = "whiteBoard.png";
        link.href = this.canvas.toDataURL("image/png");
        link.click();
    }
}