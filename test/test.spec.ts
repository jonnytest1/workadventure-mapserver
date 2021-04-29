import { Address } from '../resources/mapserver/models/address';
import { GeoLocation } from '../resources/mapserver/models/location';
import { TilePixel } from '../resources/mapserver/models/tile-pixel';
import { AddressResolver } from '../resources/mapserver/service/address-from-geo';

describe('test', () => {

    it('convert geocoord', () => {
        const location = new GeoLocation(49.460983, 11.061859);
        const tile = location.toTile(2);

        const tp = new TilePixel(1, 2, 6).subtract(1);
        expect(tp.zoom)
            .toBe(6);
        expect(tile.x)
            .toBe(1.5);
    });

    it('convert json', () => {
        const loc = new Address();
        const props = Object.getOwnPropertyNames(loc);
        const pr = Object.getOwnPropertyDescriptors(loc);

        const newLoc = Object.assign(loc, { street_name: '123', state: 'asdaf' });
        console.log(pr);

    });
});