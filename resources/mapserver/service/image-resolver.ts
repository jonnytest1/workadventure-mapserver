import { ResponseCodeError } from 'express-hibernate-wrapper';
import { existsSync, promises } from 'fs';
import { load, save } from 'hibernatets';
import { dirname, join } from 'path';
import { GeoLocation } from '../models/location';
import { Tile } from '../models/tile';
import { MapResolver } from './woirld-map-resolver';
import fetch from "node-fetch";

const origins = ['a', 'b', 'c'];

export class ImageResolver {



    static async getTileForPos(location: GeoLocation, zoom: number = MapResolver.worldZoom): Promise<Tile> {
        const tempTile = location.toTile(zoom);
        return this.loadTileData(tempTile);
    }

    static getUrl(tile: Tile, topo = false) {
        const origin = origins[Math.floor(Math.random() * origins.length)];
        let url = new URL(`https://${origin}.tile.openstreetmap.org`);
        if (topo) {
            url = new URL(`https://${origin}.tile.opentopomap.org`);
        }
        url.pathname = `${tile.zoom}/${tile.x}/${tile.y}.png`;
        return url;
    }

    static async loadTileData(tempTile: Tile, topo = false): Promise<Tile> {
        const paths = [__dirname, `../../../public/tiles${topo ? "topo" : ""}`, `${tempTile.zoom}`, `${tempTile.x}-${tempTile.y}.png`];
        const resource = join(...paths);
        try {
            const buffer = await promises.readFile(resource);
            tempTile.data = buffer;
            return tempTile;
        } catch (e) {
            let loadedTile = await load(Tile, t => {
                t.zoom = tempTile.zoom;
                t.x = tempTile.x;
                t.y = tempTile.y;
                if (topo) {
                    t.topo = 1;
                }
                return;
            }, undefined, { first: true });

            if (loadedTile) {
                if (!existsSync(dirname(resource))) {
                    await promises.mkdir(dirname(resource));
                }
                promises.writeFile(resource, Buffer.from(loadedTile.data));
                return loadedTile;
            }

            let url = this.getUrl(tempTile, topo);

            console.log(url.href);
            const response = await fetch(url.href, {
                headers: {
                    'User-Agent': 'NodeFetch/2.6.1'
                }
            });
            if (response.status !== 200) {
                throw new ResponseCodeError(response.status, await response.text());
            }
            tempTile.data = await response.arrayBuffer();
            promises.mkdir(dirname(resource), { recursive: true }).then(() => {
                promises.writeFile(resource, Buffer.from(tempTile.data));
            });
            save(tempTile);
            return tempTile;
        }
    }

}