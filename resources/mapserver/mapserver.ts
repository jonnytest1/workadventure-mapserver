
import { GET, HttpRequest, HttpResponse, Path, POST, ResponseCodeError } from 'express-hibernate-wrapper';
import { promises } from 'fs';
import { load, save } from 'hibernatets';
import { DataBaseBase } from 'hibernatets/mariadb-base';
import { join } from 'path';
import { GeoLocation } from './models/location';
import { Site } from './models/site';
import { Tile } from './models/tile';
import { AddressResolver } from './service/address-from-geo';
import { ImageResolver } from './service/image-resolver';
import { MapAttributes } from './service/map-attributes-holder';
import { MinesweeperResolver } from './service/minesweeper';
import { SitesAdder } from './service/site-adder';
import { UserMapLoader } from './service/user-map-loader';
import { MapResolver } from './service/woirld-map-resolver';
import { User } from './user/user';
@Path('mapserver')
export class Mapserver {

    private static addressResolver = new AddressResolver();

    @POST({ path: 'register', attributes: { needsUser: false } })
    async registerGitHub(req: HttpRequest, res: HttpResponse) {

        /*if (!req.body.url.endsWith('.json')&&req.body.url) {
            throw new ResponseCodeError(400, 'url needs to be a json');
        }*/
        if (isNaN(+req.body.lat) || isNaN(+req.body.lon)) {
            throw new ResponseCodeError(400, 'positions need to be a number');
        }
        const site = new Site(req.body.url, new GeoLocation(+req.body.lat, +req.body.lon));

        if (req.body.icon && typeof req.body.icon === 'number') {
            site.iconIndex = req.body.icon;
        }
        //const location = site.getLocation();
        // site.address = await Mapserver.addressResolver.getAddressFromGeo(location);
        await save(site);
        new DataBaseBase().sqlquery('DELETE FROM mapcache');

        res.send('ok');
        /*if (!countries[site.address.country_code]) {
            const countryData = await Mapserver.addressResolver.getCountryData(location);
            const imageTile = await ImageResolver.getTileForPos(location);
            //https://c.tile.openstreetmap.de/{z}/{x}/{y}.png
            countries[site.address.country_code] = {
                boundingbox: countryData.boundingbox,
                tile: imageTile
            };
            console.log('set country');
        }*/

    }

    @GET({ path: '', attributes: { needsUser: false } })
    async index(req, res: HttpResponse) {
        res.redirect('../../../mapserver/register.html');
    }

    @GET({ path: 'mapscript.js', attributes: { needsUser: false } })
    @GET({ path: '/world/mapscript.js', attributes: { needsUser: false } })
    @GET({ path: ':_/lat/:_/lon/:_/mapscript.js', attributes: { needsUser: false } })
    async getMapScript(req: HttpRequest<User>, res: HttpResponse) {
        const resource = join(__dirname, '../../public/mapscript.js');

        let buffer = await promises.readFile(resource, { encoding: 'utf8' });

        res.set('Content-Type', 'application/javascript')
            .send(buffer);
    }

    @GET({ path: 'image/:zoom/:x/:y.png', attributes: { needsUser: false } })
    @GET({ path: '/world/image/:zoom/:x/:y.png', attributes: { needsUser: false } })
    @GET({ path: ':_/lat/:_/lon/:_/image/:zoom/:x/:y.png', attributes: { needsUser: false } })
    async countryimage(req: HttpRequest, res: HttpResponse) {


        const tempTile = new Tile();
        tempTile.x = req.params.y; //stored wrong :(
        tempTile.y = req.params.x;
        tempTile.zoom = req.params.zoom;
        const tile = await ImageResolver.loadTileData(tempTile);
        res.set('Content-Type', 'image/png')
            .send(Buffer.from(await tile.data));

    }
    @GET({ path: 'usermap/assets/:image', attributes: { needsUser: false } })
    @GET({ path: 'assets/:image', attributes: { needsUser: false } })
    @GET({ path: '/world/assets/:image', attributes: { needsUser: false } })
    @GET({ path: ':zoom/lat/:tileX/lon/:tileY/assets/:image', attributes: { needsUser: false } })
    async assets(req, res) {
        const path = req.params.image;
        if (path.includes('..') || path.includes('/')) {
            throw new ResponseCodeError(403, '');
        }
        const resource = join(__dirname, `../../public/`, path);

        const buffer = await promises.readFile(resource);
        res.set('Content-Type', 'image/png')
            .send(buffer);
    }

    @GET({ path: 'site.json', attributes: { needsUser: false } })
    @GET({ path: '/world/site.json', attributes: { needsUser: false } })
    async getRenderedSite(req: HttpRequest, res) {
        if (req.path.includes('/world/site.json')) {
            const worldMapJsonString = await new MapResolver().getWorldMapJson();
            res.set('Content-Type', 'application/json')
                .send(worldMapJsonString);
            return;
        }
        const sites = await load(Site, 'TRUE=TRUE', undefined, {
            deep: true
        });

        const pixel = new SitesAdder(new MapResolver()).getFirstTilePixelWithMultipleSites(sites);
        //console.log(`${pixel.zoom} - ${pixel.lon} - ${pixel.lat}`);
        const topLevelJsonString = await new MapResolver(pixel.zoom, pixel.lon, pixel.lat).getWorldMapJson();
        res.set('Content-Type', 'application/json')
            .send(topLevelJsonString);
    }

    @GET({ path: ':zoom/lat/:tileX/lon/:tileY/site.json', attributes: { needsUser: false } })
    async getRenderedSiteForPosition(req: HttpRequest, res: HttpResponse) {
        if (!req.params.zoom || isNaN(+req.params.zoom)) {
            res.status(400)
                .send();
            return;
        }
        let zoom = +req.params.zoom;
        if (zoom > SitesAdder.maxZoom) {
            throw new ResponseCodeError(400, "zoom level too high");
        }

        const mapReolver = new MapResolver(zoom, +req.params.tileX, +req.params.tileY, MapAttributes.layerSizePerMap);
        const worldMapJsonString = await mapReolver.getWorldMapJson();
        res.set('Content-Type', 'application/json')
            .send(worldMapJsonString);
    }

    @GET({ path: 'usermap/:referenceUuid.json' })
    async getUserMap(req: HttpRequest<User>, res: HttpResponse) {
        console.log(req.params.referenceUuid);

        const user = await load(User, u => u.referenceUuid = req.params.referenceUuid, undefined, {
            first: true,
            deep: {
                attributes: 'TRUE=TRUE',
                privateMapOverrides: 'TRUE=TRUE'
            }
        });
        const mapJson = await new UserMapLoader().getMapJsonForUser(user);
        res.set('Content-Type', 'application/json')
            .send(mapJson);
    }

    @GET({ path: "minesweeper.json", attributes: { needsUser: false } })
    async getPlainMinesweeperMap(req: HttpRequest<User>, res: HttpResponse) {
        res.send(await new MinesweeperResolver(true).buildMap());
    }
}