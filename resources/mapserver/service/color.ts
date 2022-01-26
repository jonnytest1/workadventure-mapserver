export class Color {

    private r: number
    g: number
    b: number


    constructor(col: string) {
        if (typeof col == "string") {
            const vals = col.replace("rgb(", "").split(")")[0].split(",");

            this.r = +vals.shift();
            this.g = +vals.shift();
            this.b = + vals.shift();
        }
    }
    get rgbString() {
        return `rgb(${this.r},${this.g},${this.b})`;
    }

    similar(other: Color, tolerance = 5) {
        return Math.abs(other.r - this.r) < tolerance
            && Math.abs(other.g - this.g) < tolerance
            && Math.abs(other.b - this.b) < tolerance;
    }
}