import { Vector } from '../../models/vector';
import { MapFactory } from './generic-map-factory';
import { LayerFactory } from './layer-factory/layer-factory';

export abstract class GameMapMapFactory<T> extends MapFactory {

    protected gameMap: Array<Array<T>> = []

    constructor() {
        super();

        this.forEachPosition(position => {
            if (!this.gameMap[position.lat]) {
                this.gameMap[position.lat] = new Array(this.getMapSize().lon)
                    .fill(null)
                    .map(() => this.gameTileInitializer());
            }
        });

    }

    abstract gameTileInitializer(): T

    abstract gameTileToIndex(tile: T): number

    protected forEachPosition(cb: ((pos: Vector) => void)) {
        for (let y = 0; y < this.getMapSize().lat; y++) {
            for (let x = 0; x < this.getMapSize().lon; x++) {
                cb(new Vector(y, x));
            }
        }
    }

    forAreaAround(callback: ((pos: Vector, offsetVector: Vector) => void), center: Vector, offset = 1, includeCenter = true) {
        for (let offY = -offset; offY <= offset; offY++) {
            for (let offX = -offset; offX <= offset; offX++) {
                if (!includeCenter && offY == 0 && offX == 0) {
                    continue;
                }
                const offsetVector = new Vector(offX, offY);
                callback(center.added(offsetVector), offsetVector);
            }
        }
    }


    protected getPosition(position: Vector): T {
        return this.gameMap[position.lat]?.[position.lon];
    }

    protected getGameMapLayerName() {
        return "gameMap";
    }


    protected gameMapLayer(): LayerFactory {
        const dataArray = new Array(this.getMapSize().lat * this.getMapSize().lon).fill(0);

        this.forEachPosition(pos => {
            const tile = this.getPosition(pos);
            dataArray[pos.toArrayIndex(this.getMapSize().lat)] = this.gameTileToIndex(tile);
        });


        return new LayerFactory().withData(dataArray).withName(this.getGameMapLayerName());

    }
}