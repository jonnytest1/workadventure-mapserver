
export class MapAttributes {

    static readonly imageSize = 256; // amounts of pixels per image

    static readonly tileSize = 32;  //amount of pixel per tile
    static readonly indexesPerTile = MapAttributes.imageSize / MapAttributes.tileSize;

    static readonly layerSizePerMap = 7; // 16

    static readonly startTileIndex = 374;  //tile:1

    constructor() {
        //TODO
    }

    static getMaxAmountOfImagesForZoom(zoom: number) {
        return Math.pow(2, zoom);
    }

    static getAmountOfIndicesForZoom(zoom: number) {
        return this.getMaxAmountOfImagesForZoom(zoom) * MapAttributes.indexesPerTile;
    }


    static
}