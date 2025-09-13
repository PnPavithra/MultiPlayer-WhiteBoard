import { UserHistory } from "./userHistory.js";

export class StrokeManager 
{
    constructor(ctx, maxStrokes = 50) 
    {
        this.ctx = ctx;
        this.maxStrokes = maxStrokes;
        this.userHistories = new Map();
    }

    ensureUserId(userId) 
    {
        if (!this.userHistories.has(userId)) 
        {
            this.userHistories.set(userId, new UserHistory(this.maxStrokes));
        }
        return this.userHistories.get(userId);
    }

    addStroke(stroke) 
    {
        const history = this.ensureUserId(stroke.userId);
        history.addUserHistoryStroke(stroke);
        this.redraw();
    }

    removeStroke(id) 
    {
        for (const history of this.userHistories.values()) 
        {
            const index = history.historyStrokes.findIndex(s => s.id === id);
            if (index !== -1) 
            {
                history.historyStrokes.splice(index, 1);
                if (history.currentIndex >= index) history.currentIndex--;
                break;
            }
        }
        this.redraw();
    }

    undo(userId) 
    {
        const history = this.ensureUserId(userId);
        const stroke = history.undo();
        this.redraw();
        return stroke;
    }

    redo(userId) 
    {
        const history = this.ensureUserId(userId);
        const stroke = history.redo();
        this.redraw();
        return stroke;
    }

    drawStroke(stroke) 
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = stroke.size;
        this.ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        for (let i = 0; i < stroke.points.length; i++) 
        {
            const { x, y } = stroke.points[i];
            if (i === 0) 
            {
                this.ctx.moveTo(x, y);
            }
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }

    redraw() 
    {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (const history of this.userHistories.values()) 
        {
            for (const stroke of history.getActiveStrokes()) 
            {
                this.drawStroke(stroke);
            }
        }
    }

    clear(userId) 
    {
        if (userId) 
        {
            const history = this.ensureUserId(userId);
            history.clear();
        } 

        else 
        {
            this.userHistories.clear();
        }
        this.redraw();
    }

    getAllStrokes() 
    {
        const all = [];
        for (const history of this.userHistories.values()) 
        {
            all.push(...history.historyStrokes);
        }
        return all;
    }
}
