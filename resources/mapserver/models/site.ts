import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { Address } from './address';
import { GeoLocation } from './location';
import { SiteTilePosition } from './site-tile-position';

@table()
export class Site {
    @primary()
    id: string;

    @mapping(Mappings.OneToOne, Address)
    address: Address;

    @mapping(Mappings.OneToMany, SiteTilePosition, 'site')
    tilePositions: Array<SiteTilePosition> = [];

    @column()
    public url?: string;

    @column({ type: 'number' })
    public lat: number;

    @column({ type: 'number' })
    public lon: number;

    @column({ type: 'number' })
    public iconIndex: number;

    constructor(url?: string, location?: GeoLocation) {
        if (url) {
            this.url = url;
        }
        if (location) {
            this.lat = location.lat;
            this.lon = location.lon;
        }

    }

    getLocation(): GeoLocation {
        return new GeoLocation(this.lat, this.lon);
    }
}