export class UserHistory {
    constructor(maxStrokes = 10) {
        this.maxStrokes = maxStrokes;
        this.historyStrokes = []; // primary array storing all strokes
        this.currentIndex = -1;   // pointer for undo/redo
    }

    // Add new stroke, remove future redo strokes
    addUserHistoryStroke(stroke) {
        // Remove any redo strokes beyond currentIndex
        this.historyStrokes = this.historyStrokes.slice(0, this.currentIndex + 1);

        this.historyStrokes.push(stroke);

        // Limit history to maxStrokes
        if (this.historyStrokes.length > this.maxStrokes) {
            this.historyStrokes.shift();
        }

        this.currentIndex = this.historyStrokes.length - 1;
    }

    // Undo: move pointer back
    undo() {
        if (this.currentIndex >= 0) {
            const stroke = this.historyStrokes[this.currentIndex];
            this.currentIndex--;
            return stroke;
        }
        return null;
    }

    // Redo: move pointer forward
    redo() {
        if (this.currentIndex < this.historyStrokes.length - 1) {
            this.currentIndex++;
            return this.historyStrokes[this.currentIndex];
        }
        return null;
    }

    // Get all active strokes up to currentIndex
    getActiveStrokes() {
        return this.historyStrokes.slice(0, this.currentIndex + 1);
    }

    // Clear all strokes
    clear() {
        this.historyStrokes = [];
        this.currentIndex = -1;
    }
}
