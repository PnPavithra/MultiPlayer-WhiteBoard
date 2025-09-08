export class BrushSettings{

    constructor(colorPickerId, sizePickerId){
        this.colorPicker = document.getElementById(colorPickerId);
        this.sizePicker = document.getElementById(sizePickerId);

        this.color = this.colorPicker.value;
        this.size =this.sizePicker.value;

        this.colorPicker.addEventListener("input", e=>{
            this.color = e.target.value;
        });

        this.sizePicker.addEventListener("input", e=>{
            this.size = e.target.value;
        });
    }

    getBrushColor() {
        return this.color;
    }

    getBrushSize() {
        return this.size;
    }  

    setBrushColor(newColor) {
        this.color = newColor;
        this.colorPicker.value = newColor;
    }

    setBrushSize(newSize) {
        this.size = newSize;
        this.sizePicker.value = newSize;
    }
}