export class Vector {

    constructor(public lat: number, public lon: number) { }

    clone() {
        const newVector: this = Object.create(this);
        Object.assign(newVector, this);
        return newVector;
    }
    dividedBy(divisor: number): this {
        const newVector: this = this.clone();
        newVector.lat = this.lat / divisor;
        newVector.lon = this.lon / divisor;
        return newVector;
    }
    multipliedBy(divisor: number): this {
        const newVector: this = this.clone();
        newVector.lat = this.lat * divisor;
        newVector.lon = this.lon * divisor;
        return newVector;
    }
    rounded() {
        const newVector: this = this.clone();
        newVector.lat = Math.round(this.lat);
        newVector.lon = Math.round(this.lon);
        return newVector;
    }
    subtract(amount: number, amountLat?: number) {
        const newVector: this = this.clone();
        newVector.lat = this.lat - amount;
        let difflat = amountLat;
        if (difflat === undefined) {
            difflat = amount;
        }

        newVector.lon = this.lon - difflat;
        return newVector;
    }
    floored(lat = true, lon = true) {
        const newVector: this = this.clone();
        if (lat) {
            newVector.lat = Math.floor(this.lat);
        }
        if (lon) {
            newVector.lon = Math.floor(this.lon);
        }
        return newVector;
    }

    added(pixel: Vector | number, amountLat?: number): this {
        let addX: number;
        let addY: number;

        if (pixel instanceof Vector) {
            const loc = pixel as Vector;
            addX = loc.lat;
            addY = loc.lon;
        } else {
            const amount = pixel as number;
            addX = amount;
            addY = amountLat | amount;
        }
        const newVector: this = this.clone();
        newVector.lat = this.lat + addX;
        newVector.lon = this.lon + addY;
        return newVector;
    }
    equals(startPoint: Vector): boolean {
        return startPoint.lat === this.lat && startPoint.lon === this.lon;
    }

    limit(max: number) {
        const newVector: this = this.clone();
        newVector.lat = Math.min(this.lat, max);
        newVector.lon = Math.min(this.lon, max);
        return newVector;
    }

    atLeast(min: number): Vector {
        const newVector: this = this.clone();
        newVector.lat = Math.max(this.lat, min);
        newVector.lon = Math.max(this.lon, min);
        return newVector;
    }

    toString() {
        return `{"lat":${this.lat},"lon":${this.lon}}`;
    }
}