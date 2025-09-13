export class UserHistory 
{
    constructor(maxStrokes = 10) 
    {
        this.maxStrokes = maxStrokes;
        this.historyStrokes = [];
        this.currentIndex = -1;
    }
    
    addUserHistoryStroke(stroke) 
    {
        this.historyStrokes = this.historyStrokes.slice(0, this.currentIndex + 1);

        this.historyStrokes.push(stroke);

        if (this.historyStrokes.length > this.maxStrokes) 
        {
            this.historyStrokes.shift();
        }

        this.currentIndex = this.historyStrokes.length - 1;
    }

    undo() 
    {
        if (this.currentIndex >= 0) 
        {
            const stroke = this.historyStrokes[this.currentIndex];
            this.currentIndex--;
            return stroke;
        }
        return null;
    }

    redo() 
    {
        if (this.currentIndex < this.historyStrokes.length - 1) 
        {
            this.currentIndex++;
            return this.historyStrokes[this.currentIndex];
        }
        return null;
    }

    getActiveStrokes() 
    {
        return this.historyStrokes.slice(0, this.currentIndex + 1);
    }

    clear() 
    {
        this.historyStrokes = [];
        this.currentIndex = -1;
    }
}
