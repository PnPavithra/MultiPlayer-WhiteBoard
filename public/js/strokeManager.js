export class StrokeManager
{

    constructor(ctx)
    {
        this.ctx = ctx;
        this.strokes = [];
    }

    addStroke(stroke)
    {
        this.strokes.push(stroke);
    }

    drawStroke(stroke)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = stroke.size;
        this.ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
        
        this.ctx.lineCap = "round";
        this.lineJoin = "round";

        for(let i = 0; i<stroke.points.length; i++)
        {
            const { x, y } = stroke.points[i];

            if(i === 0)
            {
                this.ctx.moveTo(x, y);
            }

            else
            {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    redraw()
    {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for(const stroke of this.strokes)
        {
            this.drawStroke(stroke);
        }
    }
}