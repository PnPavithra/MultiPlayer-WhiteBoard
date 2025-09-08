export class ToolManager{

    constructor(brushSettings){

        this.brushSettings = brushSettings;

        this.penColor = this.brushSettings.getBrushColor();
        this.penSize = this.brushSettings.getBrushSize();

        this.activeTool = "pen";
    }

    usePen(){
        this.activeTool = "pen";
        this.brushSettings.setBrushColor(this.penColor);
        this.brushSettings.setBrushSize(this.penSize);
    }

    useEraser() {
        this.activeTool = "eraser";
        this.brushSettings.setBrushColor("#ffffff");
        this.brushSettings.setBrushSize(this.eraserSize);
    }

    updatePenSettings() {
        if(this.activeTool === "pen") {
            this.penColor = this.brushSettings.getBrushColor();
            this.penSize = this.brushSettings.getBrushSize();
        }

        else if(this.activeTool === "eraser"){
            this.eraserSize = this.brushSettings.getBrushSize();
        }
    }

    getToolColor() {
        return this.activeTool === "eraser" ? "#ffffff" : this.penColor;
    }

    getToolSize(){
        return this.activeTool === "eraser" ? this.eraserSize : this.penSize;
    }
}