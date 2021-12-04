import { Vector } from '../models/vector';
import { User } from '../user/user';
import { ILayer } from './map';
import { LayerFactory } from './generic-map-factory/layer-factory/layer-factory';
import { MapFactory } from './generic-map-factory/generic-map-factory';
export class MinesweeperResolver extends MapFactory {


    static readonly mapWidth = 32

    static readonly bounds: Vector = new Vector(MinesweeperResolver.mapWidth, MinesweeperResolver.mapWidth)

    static userGameMap: Record<string, MinesweeperResolver> = {}

    private mineMap: { value: number, uncovered?: boolean }[][] = [];

    getMapSize(): Vector {
        return MinesweeperResolver.bounds;
    }
    getStartLayerData(): Vector[] {
        return [new Vector(16, 16)];
    }

    constructor() {
        super();
        this.forEachPosition(position => {
            if (!this.mineMap[position.lat]) {
                this.mineMap[position.lat] = new Array(MinesweeperResolver.bounds.lon)
                    .fill(null)
                    .map(() => ({ value: 0 }));
            }
        });
        this.forEachPosition(position => {
            const rnd = Math.random();
            if (rnd > 0.9) {
                this.setPosition(position, -10);//negative means bomb even if its falsely incremented 9 times its still negative
                this.incrementArea(position);
            }
        });
    }
    incrementArea(position: Vector) {
        for (let offY = -1; offY <= 1; offY++) {
            for (let offX = -1; offX <= 1; offX++) {
                const offsetPosition = position.added(new Vector(offX, offY));
                const positionObj = this.getPosition(offsetPosition);
                if (positionObj) {
                    positionObj.value++;
                }
            }
        }
    }

    forEachPosition(cb: ((pos: Vector) => void)) {
        for (let y = 0; y < MinesweeperResolver.bounds.lat; y++) {
            for (let x = 0; x < MinesweeperResolver.bounds.lon; x++) {
                cb(new Vector(y, x));
            }
        }
    }

    static getMapResolver(user: User) {
        MinesweeperResolver.userGameMap[user.id] = MinesweeperResolver.userGameMap[user?.id] || new MinesweeperResolver();
        return MinesweeperResolver.userGameMap[user.id];
    }

    setPosition(position: Vector, value: number) {
        const positionObj = this.getPosition(position);
        positionObj.value = value;
    }

    getPosition(position: Vector) {
        return this.mineMap[position.lat]?.[position.lon];
    }

    async buildMap() {
        await this.getMapJson(() => {
            this.addLayer(new LayerFactory()
                .withName("background")
                .withData(new Array(MinesweeperResolver.bounds.lat * MinesweeperResolver.bounds.lon).fill(117)));
            this.addLayer(this.getGameLayer());
            this.addLayer(new LayerFactory()
                .withName("hover-layer")
                .withOpacity(0.4)
                .withData(new Array(MinesweeperResolver.bounds.lat * MinesweeperResolver.bounds.lon)
                    .fill(0)));
        });
        const scriptProp = this.mapJson.properties.find(p => p.name == "script");
        scriptProp.value = "https://jonnytest1.github.io/workadventuremap/scripts/index.js?url=./user-update.js,./game-mode.js,https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/minesweeper.js";


        return JSON.stringify(this.mapJson);
    }

    getGameLayer(): ILayer {
        const dataArray = new Array(MinesweeperResolver.bounds.lat * MinesweeperResolver.bounds.lon);

        this.forEachPosition(pos => {
            const value = this.getPosition(pos).value;
            if (value < 0) {
                dataArray[pos.toArrayIndex(this.mineMap)] = 27; // mine tile
            } else if (value === 0) {
                dataArray[pos.toArrayIndex(this.mineMap)] = 0;
            } else {
                dataArray[pos.toArrayIndex(this.mineMap)] = 80 + value; // numbers
            }

        });


        return new LayerFactory().withData(dataArray).withName("minesweepermap").toJson();
    }

    toString() {
        return this.mineMap
            .map(line => line
                .map(el => el.value).join(",")
            ).join("\n");
    }
}