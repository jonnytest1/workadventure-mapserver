///<reference path="../../jonny-maps/scripts/index.d.ts" />

scriptNesting(Promise.all([
    WA.room.getTiledMap(),
    require("@jonnygithub/backend-connection"),
    WA.onInit()]),
    async (imports) => {
        const [map, { message }] = await imports;


        const initialEvents = await message({
            type: "initialise"
        });
        WA.room.setTiles(initialEvents);

        /**
         * 
         * @param {import("./users").Position} pos 
         */
        async function uncoverPosition(pos) {
            const response = await message({
                type: "uncover",
                data: pos
            });

            WA.room.setTiles(response.newTiles);

            if(response.state == "boom") {
                let tiles = response.newTiles.filter(tile => tile.layer == "hover-layer");
                setTimeout(() => {
                    WA.room.setTiles(tiles.map(t => ({ ...t, tile: 0 })));
                }, 1500);
                WA.ui.displayActionMessage({
                    message: "you lost :(",
                    type: "warning",
                    callback: async () => {
                        const initialEvents = await message({
                            type: "initialise"
                        });
                        WA.room.setTiles(initialEvents);
                    }
                });
            }
        }

        /**
         * @type { ReturnType<typeof WA["ui"]["displayActionMessage"]>}
         */
        let prevMessage;

        /**
         * 
         * @param {import("./users").Position} oldPos 
         * @param {import("./users").Position} newPos 
         */
        function onPositionCHange(oldPos, newPos) {
            if(prevMessage) {
                prevMessage.remove();
            }
            prevMessage = WA.ui.displayActionMessage({
                message: "uncover",
                type: "message",
                callback: () => {
                    uncoverPosition(newPos);
                }
            });
            if(oldPos.x !== null) {
                WA.room.setTiles([
                    {
                        layer: "hover-layer",
                        tile: 0,
                        ...oldPos
                    }
                ]);
            }
            WA.room.setTiles([
                {
                    layer: "hover-layer",
                    tile: 28,
                    ...newPos
                }
            ]);
        }


        let lastX = null;
        let lastY = null;

        WA.player.onPlayerMove(pos => {
            const newX = Math.floor(pos.x / map.tilewidth);
            const newY = Math.floor(pos.y / map.tileheight);


            if(lastY !== newY || lastX !== newX) {
                onPositionCHange({ x: lastX, y: lastY }, { x: newX, y: newY });
            }

            lastX = newX;
            lastY = newY;
        });

    });


console.log("test");