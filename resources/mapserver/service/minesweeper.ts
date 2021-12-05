import { Vector } from '../models/vector';
import { User } from '../user/user';
import { LayerFactory } from './generic-map-factory/layer-factory/layer-factory';
import { GameMapMapFactory } from './generic-map-factory/game-map-map-factory';
import { Position } from '../../../public/users';

interface GameTileState {
    value: number

    uncovered?: boolean

    iterated?: boolean
}

//@ts-ignore
type TileDescriptorArray = Parameters<import("../../../../jonny-maps/scripts/index").WorkAdventureApi["room"]["setTiles"]>["0"]

export class MinesweeperResolver extends GameMapMapFactory<GameTileState> {

    static readonly mapWidth = 32

    static readonly bounds: Vector = new Vector(MinesweeperResolver.mapWidth, MinesweeperResolver.mapWidth)

    static userGameMap: Record<string, MinesweeperResolver> = {}

    public lostGame: boolean
    constructor(plain = false) {
        super();
        if (!plain) {
            this.forEachPosition(position => {
                const rnd = Math.random();
                if (rnd > 0.9) {
                    this.setPosition(position, -10);//negative means bomb even if its falsely incremented 9 times its still negative
                    this.incrementArea(position);
                }
            });
        }
    }
    getMapSize(): Vector {
        return MinesweeperResolver.bounds;
    }
    getStartLayerData(): Vector[] {
        return [new Vector(16, 16)];
    }

    gameTileInitializer(): { value: number; } {
        return { value: 0 };
    }
    getUncovered() {
        const uncovered: TileDescriptorArray = [];
        this.forEachPosition(pos => {
            const tileState = this.getPosition(pos);

            uncovered.push(this.toTileDescriptor(pos, tileState));

        });

        return uncovered;
    }

    toTileDescriptor(pos: Vector, tile: GameTileState): TileDescriptorArray[0] {
        return {
            layer: this.getGameMapLayerName(),
            tile: this.gameTileToIndex(tile),
            ...pos.toPosition()
        };
    }


    uncoverEmpty(startPos: Vector, collector: TileDescriptorArray) {
        const stateTile = this.getPosition(startPos);
        if (stateTile && !stateTile.iterated && !stateTile.uncovered && stateTile.value >= 0) {

            stateTile.iterated = true;
            stateTile.uncovered = true;

            collector.push(this.toTileDescriptor(startPos, stateTile));
            if (stateTile.value === 0) {
                this.forAreaAround(vec => {
                    this.uncoverEmpty(vec, collector);
                }, startPos);
            }
        }

    }

    iterateBombs(startPos: Vector, collector: TileDescriptorArray) {
        const stateTile = this.getPosition(startPos);
        if (!stateTile.iterated && !stateTile.uncovered && stateTile.value < 0) {

            stateTile.uncovered = true;
            stateTile.iterated = true;
            this.forAreaAround((vec, offsetVector) => {
                if (this.getPosition(vec)) {
                    let index = 0;
                    if (offsetVector.lon == -2) {
                        index = 25 + (offsetVector.lat / 2);
                    } else if (offsetVector.lon == 2) {
                        index = 71 + (offsetVector.lat / 2);
                    } else if (offsetVector.lon == 0) {
                        index = 48 + (offsetVector.lat / 2);
                    }
                    if (Math.floor(index) !== index || Math.abs(offsetVector.lon) == 1 || Math.abs(offsetVector.lat) == 1) {
                        index = 48;
                    }
                    collector.push({
                        layer: "hover-layer",
                        tile: index,
                        ...vec.toPosition()
                    });
                    this.iterateBombs(vec, collector);
                }
            }, startPos, 2);
        }
    }

    uncover(position: Position) {
        this.forEachPosition(pos => {
            this.getPosition(pos).iterated = false;
        });

        const newTiles: TileDescriptorArray = [];

        const startPos = new Vector(position.x, position.y);
        this.uncoverEmpty(startPos, newTiles);

        let state = "uncovered";
        if (!newTiles.length) {
            const stateTile = this.getPosition(startPos);
            if (stateTile.value < 0) {
                this.forEachPosition(pos => {
                    this.getPosition(pos).iterated = false;
                });
                this.iterateBombs(startPos, newTiles);
                this.forEachPosition(pos => {
                    const state = this.getPosition(pos);
                    if (state.value < 0) {
                        newTiles.push(this.toTileDescriptor(pos, stateTile));
                    }
                });
                state = "boom";
                this.lostGame = true;
            } else {
                newTiles.push(this.toTileDescriptor(startPos, stateTile));
            }
        }

        return {
            state,
            newTiles: newTiles
        };
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

    static getMapResolver(user: User) {
        MinesweeperResolver.userGameMap[user.id] = MinesweeperResolver.userGameMap[user?.id] || new MinesweeperResolver();
        if (MinesweeperResolver.userGameMap[user.id].lostGame) {
            MinesweeperResolver.userGameMap[user.id] = new MinesweeperResolver();
        }
        return MinesweeperResolver.userGameMap[user.id];
    }

    setPosition(position: Vector, value: number) {
        const positionObj = this.getPosition(position);
        positionObj.value = value;
    }


    async buildMap() {
        await this.getMapJson(() => {
            this.addLayer(new LayerFactory()
                .withName("background")
                .withData(new Array(MinesweeperResolver.bounds.lat * MinesweeperResolver.bounds.lon).fill(117)));
            this.addLayer(this.gameMapLayer());
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
    gameTileToIndex(tile: GameTileState): number {
        const value = tile.value;
        if (!tile.uncovered) {
            return 93;
        }

        if (value < 0) {
            return 27; // mine tile
        } else if (value === 0) {
            return 31; // some planks indicating no danger
        } else {
            return 80 + value; // numbers
        }
    }


    toString() {
        return this.gameMap
            .map(line => line
                .map(el => el.value).join(",")
            ).join("\n");
    }
}