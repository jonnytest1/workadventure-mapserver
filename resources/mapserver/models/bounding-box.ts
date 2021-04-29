import { Vector } from './vector';

export class BoundingBox {

    constructor(private topLeft: Vector, private bottomRight: Vector) {

    }

    includes(inner: Vector): boolean {
        return inner.lat < this.bottomRight.lat && inner.lon < this.bottomRight.lon
            && inner.lat > this.topLeft.lat && inner.lon > this.topLeft.lon;
    }
}