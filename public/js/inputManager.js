export class InputManager{
    constructor(canvas, toolManager, strokeManager, canvasManager, network){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        
        this.strokeManager = strokeManager;
        this.toolManager = toolManager;
        this.network = network;
        this.canvasManager = canvasManager;

        this.currentStroke = null;
        this.remoteStrokes = {};
        this.drawing = false;
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

        this.network.on("draw:end", ({userId})=>
        {
            const stroke = this.remoteStrokes[userId];

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
                tool: this.currentStroke.tool,
                color: this.currentStroke.color,
                size: this.currentStroke.size,
                points: this.currentStroke.points
            });
        }

        this.drawing = false;
        this.currentStroke = null;
    }

}