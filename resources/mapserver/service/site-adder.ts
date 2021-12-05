import { load } from 'hibernatets';
import { BoundingBox } from '../models/bounding-box';
import { Site } from '../models/site';
import { SiteTilePosition } from '../models/site-tile-position';
import { TilePixel } from '../models/tile-pixel';
import { Vector } from '../models/vector';
import { MapJson } from './map';
import { MapAttributes } from './map-attributes-holder';
import { MapResolver } from './woirld-map-resolver';
const houseIndex = 1;
const cityIconIndex = 2;
export class SitesAdder extends MapAttributes {
    // /_/global/pi4.e6azumuvyiabvs9s.myfritz.net
    static readonly sitePrefix = '/mapserver/rest/mapserver/';
    layerStart: Vector;
    layerEnd: Vector;
    zoom: number;
    indexesInCompleteRow: number;
    completeIndexArraySize: number;
    startIndex: number;
    startPoint: { loc: Vector; amount: number; sites: TilePixel[]; };
    defaultJson: MapJson;

    constructor(resolver: MapResolver) {
        super();
        this.layerStart = resolver.layerStart;
        this.layerEnd = resolver.layerEnd;
        this.zoom = resolver.zoom;
        this.indexesInCompleteRow = resolver.indexesInCompleteRow;
        this.completeIndexArraySize = resolver.completeIndexArraySize;
        this.startIndex = resolver.startIndex;
        this.startPoint = resolver.startPoint;
        this.defaultJson = resolver.defaultJson;
    }
    async addSites() {
        const boundingBox = new BoundingBox(
            this.layerStart.multipliedBy(MapResolver.indexesPerTile),

            this.layerEnd.multipliedBy(MapResolver.indexesPerTile)

        );
        // TODO: filter sites by sitetileposition
        /*
                const sqlSelector = `
                EXISTS(
                    SELECT *
                    from sitetileposition
                    WHERE zoom=?
                    AND tileY < ?
                    AND tileY > ?
                    AND tileX < ?
                    AND tileX > ?
                )
                `
                const sqlParams = [this.zoom, end.lat, start.lat, end.lon, start.lon] */
        const sites = await load(Site, 'TRUE=TRUE', undefined, {
            deep: true
        });

        const siteMap: Map<string, Array<Site>> = this.getSiteMapForZoom(this.zoom, sites, boundingBox);

        for (let key of siteMap.keys()) {
            const pixelSites = siteMap.get(key);
            if (pixelSites.length > 1) {
                const exampleSite = pixelSites[0];
                const geoLocation = exampleSite.getLocation();

                let newZoom = this.zoom + MapResolver.zoomIncrement;

                while ([...this.getSiteMapForZoom(newZoom, pixelSites)
                    .keys()].length === 1) {
                    newZoom += MapResolver.zoomIncrement;
                }
                newZoom = Math.min(18, newZoom);

                const targetSite = exampleSite.getLocation()
                    .toTilePixel(newZoom)
                    .dividedBy(MapResolver.imageSize)
                    // .subtract(0, 1)
                    .subtract(Math.floor(MapAttributes.layerSizePerMap / 2))
                    .rounded();

                const site = new Site(`${SitesAdder.sitePrefix}${newZoom}/lat/${targetSite.lon}/lon/${targetSite.lat}/site.json`, geoLocation);
                this.addSite(site, true);
            } else {
                const site = pixelSites[0];
                this.addSite(site);
            }
        }
    }

    getFirstTilePixelWithMultipleSites(sites: Array<Site>) {
        let newZoom = this.zoom + MapResolver.zoomIncrement;

        while ([...this.getSiteMapForZoom(newZoom, sites)
            .keys()].length === 1) {
            newZoom += MapResolver.zoomIncrement;
        }

        return sites[0].getLocation()
            .toTilePixel(newZoom)
            .dividedBy(MapResolver.imageSize)
            //.subtract(0, 1)
            .subtract(Math.floor(MapAttributes.layerSizePerMap / 2))
            .rounded();
    }

    getSiteMapForZoom(zoom: number, sites: Array<Site>, boundingBox?: BoundingBox) {
        const siteMap: Map<string, Array<Site>> = new Map();

        for (let site of sites) {
            let tilePosition = site.tilePositions.find(position => position.zoom === zoom);
            //if (!tilePosition) {
            const pixel = site.getLocation()
                .toTilePixel(zoom)
                .dividedBy(MapResolver.tileSize)
                .floored();  //coudl be worse ...
            tilePosition = new SiteTilePosition();
            tilePosition.tileX = pixel.lat;
            tilePosition.tileY = pixel.lon;
            tilePosition.zoom = zoom;
            //site.tilePositions.push(tilePosition);
            //}

            if (boundingBox && !boundingBox.includes(tilePosition.toTilePixel())) {
                continue;
            }

            let tilePixelArray = siteMap.get(tilePosition.toTilePixel()
                .toString());
            if (!tilePixelArray) {
                tilePixelArray = [];
                siteMap.set(tilePosition.toTilePixel()
                    .toString(), tilePixelArray);
            }
            tilePixelArray.push(site);
        }

        /* for (const entry of siteMap.keys()) {
             console.log(entry, siteMap.get(entry)
                 .map(site => site.url));
         }*/
        return siteMap;
    }

    addSite(site: Site, group = false) {
        const siteExitArray = Array(this.completeIndexArraySize)
            .fill(0);

        const pixel = site.getLocation()
            .toTilePixel(this.zoom)
            .dividedBy(MapResolver.tileSize)
            .floored();
        // .rounded()
        //.subtract(0, 1);//(-right +left,-down +up)

        console.log(pixel, site.url);
        const pixelIndex = +pixel.lon * this.indexesInCompleteRow + +pixel.lat;
        const icon = site.iconIndex || (group ? cityIconIndex : houseIndex);
        siteExitArray.splice(pixelIndex - this.startIndex, 1, icon);
        this.startPoint.loc = this.startPoint.loc.added(pixel);
        this.startPoint.sites.push(pixel);
        this.startPoint.amount++;
        this.defaultJson.layers.push({
            data: siteExitArray,
            name: `exit-${this.startPoint.amount}-left`,
            id: 30000 + 10,
            'opacity': 0.8,
            'visible': true,
            properties: [
                {
                    name: 'exitSceneUrl',
                    type: 'string',
                    value: site.url
                }
            ],
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });
    }

}