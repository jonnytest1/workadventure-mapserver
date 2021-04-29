import { ResponseCodeError } from 'express-hibernate-wrapper';
import { load, save } from 'hibernatets';
import { GeoLocation } from '../models/location';
import { Tile } from '../models/tile';
import { MapResolver } from './woirld-map-resolver';
const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = require('node-fetch');

const origins = ['a', 'b', 'c'];

export class ImageResolver {

    static async getTileForPos(location: GeoLocation, zoom: number = MapResolver.worldZoom): Promise<Tile> {
        const tempTile = location.toTile(zoom);
        return this.loadTileData(tempTile);
    }

    static async loadTileData(tempTile: Tile): Promise<Tile> {
        let loadedTile = await load(Tile, t => {
            t.zoom = tempTile.zoom;
            t.x = tempTile.x;
            t.y = tempTile.y;
            return;
        }, undefined, { first: true });

        if (loadedTile) {
            return loadedTile;
        }

        const origin = origins[Math.floor(Math.random() * origins.length)];
        const url = new URL(`https://${origin}.tile.openstreetmap.org`);
        url.pathname = `${tempTile.zoom}/${tempTile.x}/${tempTile.y}.png`;
        console.log(url.href);
        const response = await fetch(url.href, {
            headers: {
                'User-Agent': 'NodeFetch/2.6.1'
            }
        });
        console.log(response.status);
        if (response.status !== 200) {
            throw new ResponseCodeError(response.status, await response.text());
        }
        tempTile.data = await response.arrayBuffer();
        save(tempTile);
        return tempTile;
    }

}