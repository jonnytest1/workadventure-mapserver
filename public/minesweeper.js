///<reference path="../../jonny-maps/scripts/index.d.ts" />


Promise.all([WA.room.getTiledMap(), WA.onInit()])
    .then(([map, init]) => {
        let lastX = null;
        let lastY = null;
        /**
         * @type { ReturnType<typeof WA["ui"]["displayActionMessage"]>}
         */
        let prevMessage;
        WA.player.onPlayerMove(pos => {
            const newX = Math.floor(pos.x / map.tilewidth);
            const newY = Math.floor(pos.y / map.tileheight);


            if(lastY !== newY || lastX !== newX) {
                if(prevMessage) {
                    prevMessage.remove();
                }
                prevMessage = WA.ui.displayActionMessage({
                    message: "uncover",
                    type: "message",
                    callback: () => {
                        console.log("uncovered");
                    }
                });
                if(lastX !== null) {
                    WA.room.setTiles([
                        {
                            layer: "hover-layer",
                            tile: 0,
                            x: lastX,
                            y: lastY
                        }
                    ]);
                }
                WA.room.setTiles([
                    {
                        layer: "hover-layer",
                        tile: 28,
                        x: newX,
                        y: newY
                    }
                ]);
            }

            lastX = newX;
            lastY = newY;
        });

    });
console.log("test");