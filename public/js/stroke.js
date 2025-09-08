export class Stroke{

    constructor(color, size, tool = "pen"){

        this.color = color;
        this.size = size;
        this.tool = tool;

        this.points = [];
    }

    addPoint(x, y){
        this.points.push({x, y});
    }
}