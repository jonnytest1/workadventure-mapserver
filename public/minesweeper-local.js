
/**
 * @typedef {{
 *    value: number,
 *    uncovered?: boolean,
 *    iterated?: boolean
 * }} GameTileState
 * 
 * @typedef {{x:number,y:number}} Position
 * 
 * @typedef {Parameters<import("../../jonny-maps/scripts/index").WorkAdventureApi["room"]["setTiles"]>["0"] } TileDescriptorArray
 */
module.exports = window.exportNesting([], () => {

    class Vector {

        constructor(lat, lon) {
            this.lat = lat;
            this.lon = lon;
        }

        clone() {
            const newVector = Object.create(this);
            Object.assign(newVector, this);
            return newVector;
        }
        dividedBy(divisor) {
            const newVector = this.clone();
            newVector.lat = this.lat / divisor;
            newVector.lon = this.lon / divisor;
            return newVector;
        }
        multipliedBy(divisor) {
            const newVector = this.clone();
            newVector.lat = this.lat * divisor;
            newVector.lon = this.lon * divisor;
            return newVector;
        }
        rounded() {
            const newVector = this.clone();
            newVector.lat = Math.round(this.lat);
            newVector.lon = Math.round(this.lon);
            return newVector;
        }
        subtract(amount, amountLat) {
            const newVector = this.clone();
            newVector.lat = this.lat - amount;
            let difflat = amountLat;
            if(difflat === undefined) {
                difflat = amount;
            }

            newVector.lon = this.lon - difflat;
            return newVector;
        }
        floored(lat = true, lon = true) {
            const newVector = this.clone();
            if(lat) {
                newVector.lat = Math.floor(this.lat);
            }
            if(lon) {
                newVector.lon = Math.floor(this.lon);
            }
            return newVector;
        }

        added(pixel, amountLat) {
            let addX;
            let addY;

            if(pixel instanceof Vector) {
                const loc = pixel;
                addX = loc.lat;
                addY = loc.lon;
            } else {
                const amount = pixel;
                addX = amount;
                addY = amountLat | amount;
            }
            const newVector = this.clone();
            newVector.lat = this.lat + addX;
            newVector.lon = this.lon + addY;
            return newVector;
        }
        equals(startPoint) {
            return startPoint.lat === this.lat && startPoint.lon === this.lon;
        }

        limit(max) {
            const newVector = this.clone();
            newVector.lat = Math.min(this.lat, max);
            newVector.lon = Math.min(this.lon, max);
            return newVector;
        }

        atLeast(min) {
            const newVector = this.clone();
            newVector.lat = Math.max(this.lat, min);
            newVector.lon = Math.max(this.lon, min);
            return newVector;
        }

        withLon(newLon) {
            const newVector = this.clone();
            newVector.lon = newLon;
            return newVector;
        }

        toString() {
            return `{"lat":${this.lat},"lon":${this.lon}}`;
        }

        toArrayIndex(rootArray) {
            if(typeof rootArray == "number") {
                return rootArray * this.lat + this.lon;
            }
            return rootArray.length * this.lat + this.lon;
        }

        toPosition() {
            return {
                x: this.lat,
                y: this.lon
            };
        }
    }
    class MinesweeperResolver {

        static mapWidth = 32

        static bounds = new Vector(MinesweeperResolver.mapWidth, MinesweeperResolver.mapWidth)

        /**
         * @type {Record<string,MinesweeperResolver>}
         */
        static userGameMap = {}

        lostGame = false

        gameMap = []

        constructor(plain = false) {
            this.forEachPosition(position => {
                if(!this.gameMap[position.lat]) {
                    this.gameMap[position.lat] = new Array(this.getMapSize().lon)
                        .fill(null)
                        .map(() => this.gameTileInitializer());
                }
            });
            if(!plain) {
                this.forEachPosition(position => {
                    const rnd = Math.random();
                    if(rnd > 0.9) {
                        this.setPosition(position, -10);//negative means bomb even if its falsely incremented 9 times its still negative
                        this.incrementArea(position);
                    }
                });
            }
        }


        /**
         * 
         * @param {Vector} startPos 
         * @param {TileDescriptorArray} collector 
         */
        uncoverEmpty(startPos, collector) {
            const stateTile = this.getPosition(startPos);
            if(stateTile && !stateTile.iterated && !stateTile.uncovered && stateTile.value >= 0) {

                stateTile.iterated = true;
                stateTile.uncovered = true;

                collector.push(this.toTileDescriptor(startPos, stateTile));
                if(stateTile.value === 0) {
                    this.forAreaAround(vec => {
                        this.uncoverEmpty(vec, collector);
                    }, startPos);
                }
            }

        }


        /**
         * 
         * @param {((pos: Vector, offsetVector: Vector) => void)} callback 
         * @param {Vector} center 
         * @param {number} [offset] 
         * @param {boolean} [includeCenter] 
         */
        forAreaAround(callback, center, offset = 1, includeCenter = true) {
            for(let offY = -offset; offY <= offset; offY++) {
                for(let offX = -offset; offX <= offset; offX++) {
                    if(!includeCenter && offY == 0 && offX == 0) {
                        continue;
                    }
                    const offsetVector = new Vector(offX, offY);
                    callback(center.added(offsetVector), offsetVector);
                }
            }
        }
        /**
         * 
         * @param {Position} position 
         */
        uncover(position) {
            this.forEachPosition(pos => {
                this.getPosition(pos).iterated = false;
            });

            /**
             * @type {TileDescriptorArray}
             */
            const newTiles = [];

            const startPos = new Vector(position.x, position.y);
            this.uncoverEmpty(startPos, newTiles);

            /**
             * @type {"boom"|"uncovered"|"won"}
             */
            let state = "uncovered";
            if(!newTiles.length) {
                const stateTile = this.getPosition(startPos);
                if(stateTile.value < 0) {
                    this.forEachPosition(pos => {
                        this.getPosition(pos).iterated = false;
                    });
                    this.iterateBombs(startPos, newTiles);
                    this.forEachPosition(pos => {
                        const state = this.getPosition(pos);
                        if(state.value < 0) {
                            newTiles.push(this.toTileDescriptor(pos, stateTile));
                        }
                    });
                    state = "boom";
                    this.lostGame = true;
                } else {
                    newTiles.push(this.toTileDescriptor(startPos, stateTile));
                }
            }
            let foundHiddenBomb = false;
            this.forEachPosition(pos => {
                const data = this.getPosition(pos);
                if(data.value < 0 && !data.uncovered) {
                    foundHiddenBomb = true;
                }
            });

            if(!foundHiddenBomb) {
                state = "won";
            }

            return {
                state,
                newTiles: newTiles
            };
        }
        /**
         * 
         * @param {Vector} startPos 
         * @param {TileDescriptorArray} collector 
         */
        iterateBombs(startPos, collector) {
            const stateTile = this.getPosition(startPos);
            if(!stateTile.iterated && !stateTile.uncovered && stateTile.value < 0) {

                stateTile.uncovered = true;
                stateTile.iterated = true;
                this.forAreaAround((vec, offsetVector) => {
                    if(this.getPosition(vec)) {
                        let index = 0;
                        if(offsetVector.lon == -2) {
                            index = 25 + (offsetVector.lat / 2);
                        } else if(offsetVector.lon == 2) {
                            index = 71 + (offsetVector.lat / 2);
                        } else if(offsetVector.lon == 0) {
                            index = 48 + (offsetVector.lat / 2);
                        }
                        if(Math.floor(index) !== index || Math.abs(offsetVector.lon) == 1 || Math.abs(offsetVector.lat) == 1) {
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


        /**
         * @returns {GameTileState}
         */
        gameTileInitializer() {
            return { value: 0 };
        }

        incrementArea(position) {
            for(let offY = -1; offY <= 1; offY++) {
                for(let offX = -1; offX <= 1; offX++) {
                    const offsetPosition = position.added(new Vector(offX, offY));
                    const positionObj = this.getPosition(offsetPosition);
                    if(positionObj) {
                        positionObj.value++;
                    }
                }
            }
        }

        /**
         * 
         * @param {*} position 
         * @returns {GameTileState}
         */
        getPosition(position) {
            return this.gameMap[position.lat]?.[position.lon];
        }

        setPosition(position, value) {
            const positionObj = this.getPosition(position);
            positionObj.value = value;
        }

        forEachPosition(cb) {
            for(let y = 0; y < this.getMapSize().lat; y++) {
                for(let x = 0; x < this.getMapSize().lon; x++) {
                    cb(new Vector(y, x));
                }
            }
        }

        getMapSize() {
            return MinesweeperResolver.bounds;
        }

        getUncovered() {
            /**
             * @type {TileDescriptorArray}
             */
            const uncovered = [];
            this.forEachPosition(pos => {
                const tileState = this.getPosition(pos);

                uncovered.push(this.toTileDescriptor(pos, tileState));

            });

            return uncovered;
        }
        /**
         * 
         * @param {GameTileState} tile 
         */
        gameTileToIndex(tile) {
            const value = tile.value;
            if(!tile.uncovered) {
                return 93;
            }

            if(value < 0) {
                return 27; // mine tile
            } else if(value === 0) {
                return 31; // some planks indicating no danger
            } else {
                return 80 + value; // numbers
            }
        }
        /**
         * 
         * @param {Vector} pos 
         * @param {GameTileState} tile 
         * @returns {TileDescriptorArray[0]}
         */
        toTileDescriptor(pos, tile) {
            return {
                layer: this.getGameMapLayerName(),
                tile: this.gameTileToIndex(tile),
                ...pos.toPosition()
            };
        }

        getGameMapLayerName() {
            return "gameMap";
        }



        static getMapResolver(user) {
            MinesweeperResolver.userGameMap[user.id] = MinesweeperResolver.userGameMap[user?.id] || new MinesweeperResolver();
            if(MinesweeperResolver.userGameMap[user.id].lostGame) {
                MinesweeperResolver.userGameMap[user.id] = new MinesweeperResolver();
            }
            return MinesweeperResolver.userGameMap[user.id];
        }
    }


    /**
     * @typedef {{
     *     initialise:{
     *        data:never,
     *        returnV:TileDescriptorArray
     *     },
     *     uncover:{
     *        data:Position,
     *        returnV:{
     *           state:"boom"|"uncovered"|"won",
     *           newTiles: TileDescriptorArray
     *        }
     *     }
     * }} MessageMap
     */

    const userMock = { id: 123 };
    return {
        message:
            /**
             * @template { keyof MessageMap } T 
             * @param {{type:T,data?:MessageMap[T]["data"]}} opts 
             * @returns {MessageMap[T]["returnV"]}
             */
            (opts) => {
                if(opts.type == "initialise") {
                    const minesweeperResolver = MinesweeperResolver.getMapResolver(userMock);

                    return minesweeperResolver.getUncovered();
                } else if(opts.type == "uncover") {
                    const minesweeperResolver = MinesweeperResolver.getMapResolver(userMock);
                    return minesweeperResolver.uncover(opts.data);
                }
            }
    };
});