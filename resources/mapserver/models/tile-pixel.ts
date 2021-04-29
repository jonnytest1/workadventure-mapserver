import { MapAttributes } from '../service/map-attributes-holder';
import { Vector } from './vector';

export class TilePixel extends Vector {

    constructor(x, y, public zoom) {
        super(x, y);
    }

    convertZoom(previousZoom: number, newZoom: number) {
        const amountOfIndicesInPreviousZoom = MapAttributes.getAmountOfIndicesForZoom(previousZoom);
        const amountOFIndicesInCurrentZoom = MapAttributes.getAmountOfIndicesForZoom(newZoom);

        const layerOffset = 1;

        const unscaledX = (this.lat - layerOffset) / amountOfIndicesInPreviousZoom;
        const unscaledY = (this.lon - layerOffset) / amountOfIndicesInPreviousZoom;

        const startTilex = Math.round(unscaledX * amountOFIndicesInCurrentZoom / MapAttributes.indexesPerTile);
        const startTileY = Math.round(unscaledY * amountOFIndicesInCurrentZoom / MapAttributes.indexesPerTile);

        const newVector: this = Object.create(this);
        newVector.lat = startTileY;
        newVector.lon = startTilex;
        return newVector;
    }

}