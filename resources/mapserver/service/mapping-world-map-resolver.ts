import { Tile } from '../models/tile';
import { MapResolver } from './woirld-map-resolver';
import { Image, createCanvas, Canvas } from "canvas";
import { MapAttributes } from './map-attributes-holder';
import { ImageResolver } from './image-resolver';
import { CanvasUtil } from './canvas-util';
import { promises } from "fs";
import { Vector } from '../models/vector';
import { Color } from './color';

interface ColorMapping {
    colors: Array<Color>
    index: number
}


const colors = {
    water: {
        colors: [new Color("rgb(170,211,223)")],
        index: 369
    } as ColorMapping,
    nothing: {
        colors: ["rgb(238,240,213)", "rgb(242,239,233)", "rgb(250,249,246)",
            "rgb(217,208,201)", "rgb(235,219,232)", "rgb(224,223,223)",
            "rgb(238,237,237)", "rgb(254,254,254)", "rgb(199,199,180)",
            "rgb(242,239,232)", "rgb(237,237,227)", "rgb(241,243,221)"].map(c => new Color(c)),
        index: 6
    } as ColorMapping,
    forest: {
        colors: ["rgb(173,209,158)", "rgb(205,235,176)", "rgb(200,215,171)", "rgb(189,218,178)", "rgb(189,218,177)"].map(c => new Color(c)),
        index: 139
    } as ColorMapping,
    road: {
        colors: ["rgb(247,250,191)"
            // red road
            , "rgb(227,133,153)", "rgb(225,110,137)", "rgb(244,173,141)", "rgb(233,133,154)", "231,116,141", "234,133,138"].map(str => new Color(str)),
        index: 93
    } as ColorMapping
};


export class MappingWorldMapResovler extends MapResolver {

    mapImageCache: Record<string, string> = {}

    canvas: Canvas;
    context: ReturnType<Canvas["getContext"]>;

    initialized = false

    missingColors: Record<string, number> = {}

    debugCanvas: Canvas = createCanvas(MapAttributes.imageSize * MapAttributes.layerSizePerMap, MapAttributes.imageSize * MapAttributes.layerSizePerMap)

    constructor(public zoom = MapResolver.worldZoom, firstLayerX = 0, firstLayerY = 0, layermount = MapAttributes.layerSizePerMap) {
        super(zoom, firstLayerX, firstLayerY, layermount);

        this.canvas = createCanvas(32, 32);

        this.context = this.canvas.getContext('2d');
        this.initialized = true;
    }

    async getWorldMapJson(): Promise<string> {
        await this.generateWorldMapJson();
        await promises.writeFile(`${__dirname}/dbgCanv.png`, this.debugCanvas.toBuffer());

        const canvas = createCanvas(200, 8000);
        let ct = 0;
        for (const color in this.missingColors) {
            canvas.getContext("2d").fillStyle = color;
            canvas.getContext("2d").font = "10px serif";
            canvas.getContext("2d").fillText(color, 0, ct * 32);
            ct++;
        }
        await promises.writeFile(`${__dirname}/missingcol.png`, canvas.toBuffer());
        console.log(this.missingColors);
        return JSON.stringify(this.defaultJson);
    }

    protected addGeoImageTileset(): void {
        //dont add
    }

    async drawImage(tile: Tile, col, row, topo = false) {
        const imageId = `${tile.x}_${tile.y}_${tile.zoom}`;
        let data: string;
        if (this.mapImageCache[imageId]) {
            data = this.mapImageCache[imageId];
        } else {
            const resolvedTile = await ImageResolver.loadTileData(tile, topo);
            data = Buffer.from(resolvedTile.data).toString("base64");
            this.mapImageCache[imageId] = data;
        }
        return new Promise<void>(res => {
            const img = new Image();
            img.onload = () => {
                this.context.drawImage(img, -32 * row, -32 * col);
                this.debugCanvas.getContext("2d")
                    .drawImage(img, tile.x * MapAttributes.imageSize, tile.y * MapAttributes.imageSize);
                res();
            };
            img.onerror = e => {
                throw e;
            };
            img.src = `data:image/png;base64,${data}`;
        });
    }

    async loadTileImage(bigX: number, bigY: number, tileColumn: number, tileRow: number): Promise<number> {
        const tempTile = new Tile();
        tempTile.x = bigY; //stored wrong :(
        tempTile.y = bigX;
        tempTile.zoom = this.zoom;

        const imagePos = new Vector(tempTile.x, tempTile.y);

        const tilePos = imagePos.multipliedBy(MapAttributes.imageSize)
            .added(new Vector(tileColumn, tileRow));

        const housingColors = ["rgb(217,208,201)"];
        // const forestColors = ["rgb(173,209,158)", "rgb(205,235,176)", "rgb(200,215,171)"];


        const url = await ImageResolver.getUrl(tempTile);
        await this.drawImage(tempTile, tileColumn, tileRow);
        await promises.writeFile(`${__dirname}/lastFile.jpg`, this.canvas.toBuffer("image/jpeg"));
        //217-208-201-255   106  grey  => housing
        //238-237-237 168  168 greywhite  => nothin
        //247-250-191   409  orange  => road
        const colorMap = CanvasUtil.getColorMap(this.canvas);
        const sortedColors = Object.keys(colorMap)
            .sort((c1, c2) => colorMap[c2] - colorMap[c1])
            .map(str => new Color(str));
        await this.drawImage(tempTile, tileColumn, tileRow, true);
        await promises.writeFile(`${__dirname}/lastTopoFile.jpg`, this.canvas.toBuffer("image/jpeg"));

        this.debugCanvas.getContext("2d").font = "10px serif";
        for (let x = 0; x < MapAttributes.imageSize; x += 32) {
            for (let y = 0; y < MapAttributes.imageSize; y += 32) {
                const textPos = imagePos
                    .multipliedBy(MapAttributes.imageSize)
                    .added(new Vector(x, y));
                this.debugCanvas.getContext("2d").moveTo(textPos.lat, textPos.lon);
                this.debugCanvas.getContext("2d")
                    .fillText(`${textPos.lat}\n${textPos.lon}`, textPos.lat, textPos.lon + (32 / 2));
            }

        }

        const topoMap = CanvasUtil.getColorMap(this.canvas);

        // const setColors = [...roadcolors, ...housingColors];

        const precentages: Partial<Record<keyof typeof colors, number>> = {};
        let total = 0;
        let foundColors = 0;
        for (const color of sortedColors) {
            if (colorMap[color.rgbString] > 5) {
                let found = false;
                for (const key in colors) {
                    const kMap = key as keyof typeof colors;
                    const colorSet = colors[kMap].colors;
                    if (colorSet.some(c => c.similar(color))) {
                        precentages[kMap] ??= 0;
                        precentages[kMap] += colorMap[color.rgbString];
                        foundColors += colorMap[color.rgbString];
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (color.rgbString == "rgb(241,243,221)") {
                        debugger;
                    }
                    this.missingColors[color.rgbString] ??= 0;
                    this.missingColors[color.rgbString]++;
                }
                total += colorMap[color.rgbString];
            } else {
                break;
            }
        }

        if (foundColors < total) {
            // debugger;
        }

        if (precentages.road > 5) {
            return colors.road.index;
        }

        let amount = -1;
        let usedType: keyof typeof colors = null;
        for (const tileType in precentages) {
            if (precentages[tileType] > amount) {
                usedType = tileType as keyof typeof colors;
                amount = precentages[tileType];
            }
        }
        if (usedType == null) {
            return colors.nothing.index;
        }

        if (usedType === "water" && amount !== 1024) {
            //console.log(precentages);
        }
        if (usedType == "nothing") {
            return 80 + tileColumn;
        }
        if (!colors[usedType]) {
            debugger;
        }

        return colors[usedType].index;
        /*if (roadcolors.includes(sortedColors[0])) {
            return 93;
        } else if (forestColors.includes(sortedColors[0])) {
            return 139;
        } else if (plainColors.includes(sortedColors[0])) {
            if (colorMap[sortedColors[0]] < 1000) {
                console.log("color");
            }
            return 6;
        } else if (waterColors.includes(sortedColors[0])) {
            return 369;
        } else if (colorMap[sortedColors[0]] > 100) {
            debugger;
        }
        return 6;*/


    }
    async mapTile(startGid: number, bigX: number, bigY: number, tileColumn: number, tileRow: number) {
        return this.loadTileImage(bigX, bigY, tileColumn, tileRow);
    }

}