import { ILayer } from '../../map';
import { LayerFactory } from './layer-factory';

export class ObjectLayerFactory {

    constructor(private layerFactory: LayerFactory) {

    }

    layerName = "floorLayer"

    build(): ILayer {
        return {
            draworder: 'topdown',
            opacity: 1,
            name: 'floorLayer',
            id: 30000,
            height: this.layerFactory.mapSize.lat,
            width: this.layerFactory.mapSize.lon,
            x: 0,
            y: 0,
            objects: [],
            type: 'objectgroup'
        };
    }
}