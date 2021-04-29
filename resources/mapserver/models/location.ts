import { Tile } from './tile';
import { TilePixel } from './tile-pixel';
import { Vector } from './vector';

const earthRadius = 6378137;
const maxLat = 85.0511287798;
const convert = Math.PI / 180;

const transformationConstant = 0.5 / (Math.PI * earthRadius);
export class GeoLocation extends Vector {

    toTile(zoom: number): Tile {
        const tilePixel = this.toTilePixel(zoom);

        const tile = new Tile();
        tile.x = Math.floor(tilePixel.lat / 256);
        tile.y = Math.ceil(tilePixel.lon / 256) - 1;
        tile.zoom = zoom;
        return tile;

    }

    public toTilePixel(zoom: number) {
        const lat = Math.max(Math.min(maxLat, this.lat), -maxLat);
        const sin = Math.sin(lat * convert);

        const scale = 256 * Math.pow(2, zoom);

        const projX = earthRadius * this.lon * convert;
        const projY = (earthRadius * Math.log((1 + sin) / (1 - sin)) / 2);

        const pxBoundsX = scale * (transformationConstant * projX + 0.5);
        const pxBoundsY = scale * (-transformationConstant * projY + 0.5);
        return new TilePixel(pxBoundsX, pxBoundsY, zoom);
    }

}