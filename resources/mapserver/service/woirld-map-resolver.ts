import { promises } from 'fs';
import { load, save } from 'hibernatets';
import { GeoLocation } from '../models/location';
import { MapCache } from '../models/map-cache';
import { TilePixel } from '../models/tile-pixel';
import { Vector } from '../models/vector';
import { MapJson } from './map';
import { MapAttributes } from './map-attributes-holder';
import { SitesAdder } from './site-adder';

const cachingEnabled = false;

export const startTileIndex = 374;  //tile:1
export const exitTileIndex = 384; //tile:2

export class MapResolver extends MapAttributes {

    defaultJson: MapJson;

    static worldMapJsonString;

    static readonly zoomIncrement = 4; //6
    static readonly worldZoom = 3;
    readonly startLayersId = 10000;

    readonly indexesInCompleteRow: number;

    readonly debugOffset = 0;

    private readonly layerAmount;

    readonly completeIndexArraySize: number;

    readonly startIndex: number;


    readonly indexPerTile = new Vector(MapAttributes.indexesPerTile, MapAttributes.indexesPerTile)

    startPoint = { loc: new GeoLocation(0, 0), amount: 0, sites: new Array<TilePixel>() };
    layerStart: Vector;
    layerEnd: Vector;

    constructor(public zoom = MapResolver.worldZoom, firstLayerX = 0, firstLayerY = 0, layermount = MapAttributes.layerSizePerMap) {
        super();
        this.layerStart = new Vector(firstLayerX, firstLayerY).atLeast(0);
        this.layerAmount = layermount;// MapResolver.layerSizePerMap//lastLayerX * Math.pow(2, zoom) - (firstLayerX * Math.pow(2, zoom))
        this.layerEnd = this.layerStart.added(this.layerAmount)
            .limit(MapResolver.getMaxAmountOfImagesForZoom(zoom));
        this.indexesInCompleteRow = this.layerAmount * MapResolver.indexesPerTile;
        this.completeIndexArraySize = this.indexesInCompleteRow * this.indexesInCompleteRow;
        this.startIndex = this.toIndex(this.layerStart.lat, this.layerStart.lon, 0, 0);

    }

    async getWorldMapJson() {
        let cache = await load(MapCache, c => {
            c.layerStartLat = this.layerStart.lon;
            c.layerStartLon = this.layerStart.lon;
            c.zoom = this.zoom;
        }, undefined, { first: true });
        if (!cache) {
            cache = new MapCache();
            cache.layerStartLat = this.layerStart.lon;
            cache.layerStartLon = this.layerStart.lon;
            cache.zoom = this.zoom;

            await this.generateWorldMapJson();
            cache.mapJson = JSON.stringify(this.defaultJson);
            save(cache);
        }
        return cache.mapJson;
    }

    private async generateWorldMapJson() {
        const buffer = await promises.readFile(`${__dirname}/resources/default-map.json`, { encoding: 'utf8' });
        this.defaultJson = JSON.parse(buffer);
        this.defaultJson.tilesets.length = 1;
        this.defaultJson.layers = [];
        if (MapResolver.worldMapJsonString && this.zoom === MapResolver.worldZoom && cachingEnabled) {
            return MapResolver.worldMapJsonString;
        }

        this.defaultJson.width = this.defaultJson.height = this.indexesInCompleteRow;
        let startGid = this.defaultJson.tilesets[0].firstgid + this.defaultJson.tilesets[0].tilecount;//668

        await new SitesAdder(this).addSites();

        const siteAverage = this.startPoint.loc.dividedBy(this.startPoint.amount);
        let startPoint;
        while (!startPoint || this.startPoint.sites.some(site => site.equals(startPoint))) {
            startPoint = siteAverage.added(new GeoLocation(Math.floor(Math.random() * 8) - 4, Math.floor(Math.random() * 8) - 4))
                .rounded();
        }

        const dataArray = [];
        for (let i = this.layerStart.lat; i < this.layerEnd.lat; i++) {
            for (let y = this.layerStart.lon; y < this.layerEnd.lon; y++) {
                const tileCount = Math.pow(MapResolver.indexesPerTile, 2);
                this.defaultJson.tilesets.push({
                    columns: MapResolver.indexesPerTile,
                    imageheight: MapAttributes.imageSize,
                    imagewidth: MapAttributes.imageSize,
                    image: `/image/${this.zoom}/${i}/${y}.png`,
                    name: `tileset-${this.zoom}-${i}-${y}`,
                    margin: 0,
                    spacing: 0,
                    tilecount: tileCount,
                    tileheight: MapResolver.tileSize,
                    tilewidth: MapResolver.tileSize,
                    transparentcolor: '#fff',
                    firstgid: startGid
                });
                for (let tileColumn = 0; tileColumn < this.indexPerTile.lat; tileColumn++) {
                    for (let tileRow = 0; tileRow < this.indexPerTile.lon; tileRow++) {
                        const tileIndex = tileColumn * this.indexPerTile.lat + tileRow;
                        const dataIndex = this.toIndex(i, y, tileColumn, tileRow);

                        dataArray[dataIndex - this.startIndex] = startGid + tileIndex;

                    }
                }
                startGid += tileCount;
            }
        }

        const startLayerArray = Array(this.completeIndexArraySize)
            .fill(0);

        const pixelIndex = +startPoint.lon * this.indexesInCompleteRow + +startPoint.lat;
        startLayerArray.splice(pixelIndex - this.startIndex, 1, startTileIndex);
        this.defaultJson.layers.push({
            'x': 0,
            'y': 0,
            data: startLayerArray,
            'name': 'start',
            properties: [
                {
                    'name': 'startLayer',
                    'type': 'bool',
                    'value': true
                }
            ],
            'opacity': 1,
            'type': 'tilelayer',
            'visible': true,
            'width': this.indexesInCompleteRow,
            height: this.indexesInCompleteRow,
            id: this.startLayersId + this.debugOffset

        });

        this.defaultJson.layers.push({
            data: dataArray,
            name: 'background-image',
            id: 20000,
            'opacity': 1,
            'visible': true,
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });

        this.addZoomUpIcon();

        this.defaultJson.layers.push({
            draworder: 'topdown',
            objects: [{
                'height': 50,
                'id': 99,
                'name': 'first-start-popup',
                'rotation': 0,
                'type': '',
                'visible': true,
                'width': 100,
                'x': Math.floor(this.indexesInCompleteRow / 2),
                'y': Math.floor(this.indexesInCompleteRow / 2)
            }],
            opacity: 1,
            name: 'floorLayer',
            id: 30000,
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'objectgroup'
        });

        for (let i = 0; i < this.indexesInCompleteRow; i++) {//
            //this.addContinuationLayersForRow(i); json gets too big
        }

        this.defaultJson.layers.sort((l1, l2) => l1.id - l2.id);
        this.defaultJson.layers.forEach((layers, index) => {
            layers.id = index;
        });

        const mapString = JSON.stringify(this.defaultJson);
        if (this.zoom === MapResolver.worldZoom) {
            MapResolver.worldMapJsonString = mapString;
        }
    }

    private addZoomUpIcon() {

        const previousZoom = this.zoom - MapResolver.zoomIncrement;
        let url = '/_/global/jonnytest1.github.io/workadventuremap/space/space.json';

        const zoomUpLayerArray = this.arrayWithTileAt(
            new Vector(this.layerAmount - 1, 0),
            this.indexPerTile.subtract(1, 0).withLon(0),
            4
        )

        if (previousZoom >= MapResolver.worldZoom) {
            const amountOfIndicesInPreviousZoom = MapResolver.getAmountOfIndicesForZoom(previousZoom);
            const amountOFIndicesInCurrentZoom = MapResolver.getAmountOfIndicesForZoom(this.zoom);

            const upperLayer = this.layerStart
                .dividedBy(amountOFIndicesInCurrentZoom)
                .multipliedBy(amountOfIndicesInPreviousZoom)
                .rounded()
                .subtract(Math.floor(MapAttributes.indexesPerTile / 2));
            url = `${SitesAdder.sitePrefix}${previousZoom}/lat/${upperLayer.lat}/lon/${upperLayer.lon}/site.json`;
        }
        this.defaultJson.layers.push({
            data: zoomUpLayerArray,
            name: 'zoom-up-layer',
            id: 21000,
            'opacity': 1,
            'visible': true,
            properties: [
                {
                    name: 'exitSceneUrl',
                    type: 'string',
                    value: url
                }
            ],
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });
    }

    toIndex(bigX, bigY, tileColumn, tileRow) {
        const rowStart = ((MapResolver.indexesPerTile * bigX) + tileColumn) * this.indexesInCompleteRow;
        return rowStart + (bigY * MapResolver.indexesPerTile) + tileRow;
    }


    arrayWithTileAt(tilePos: Vector, indexPos: Vector, index: number) {
        const layerArray = Array(this.completeIndexArraySize)
            .fill(0);
        const arrayPos = this.toIndex(tilePos.lat, tilePos.lon, indexPos.lat, indexPos.lon)
        layerArray[arrayPos] = index
        return layerArray;
    }

}
