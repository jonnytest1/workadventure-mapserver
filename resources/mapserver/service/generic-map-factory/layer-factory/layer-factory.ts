import { Vector } from '../../../models/vector';
import { ILayer } from '../../map';
import { ObjectLayerFactory } from './object-layer-factory';
import { v4 } from "uuid";
export class LayerFactory {


    visible: true

    startOffset = {
        x: 0, y: 0
    }

    mapSize: Vector = new Vector(0, 0)

    name: string = v4()
    data: number[]

    fillNumber?: number
    layerId: number = 1;
    opacity: number = 1;

    constructor() {

    }


    withOpacity(opacity: number) {
        this.opacity = opacity;
        return this;
    }

    withData(dataArray: Array<number>): this {
        this.data = dataArray;
        return this;
    }

    filledWith(index: number) {
        this.fillNumber = index;
        return this;
    }

    withLAyerId(layerId: number) {
        this.layerId = layerId;
        return this;
    }

    withName(name: string): this {
        this.name = name;
        return this;
    }

    withMapSize(lat: number | Vector, lon?: number): this {
        if (lat instanceof Vector) {
            this.mapSize = lat;
        } else {
            this.mapSize = new Vector(lat, lon);
        }
        return this;
    }
    toJson(): ILayer<"tilelayer"> {
        return {
            height: this.mapSize?.lat,
            width: this.mapSize.lon,
            id: this.layerId,
            data: this.data,
            name: this.name,
            type: "tilelayer",
            x: this.startOffset.x,
            y: this.startOffset.y,
            visible: this.visible,
            opacity: this.opacity
        };
    }

    floorLayer() {
        return new ObjectLayerFactory(this);
    }

}