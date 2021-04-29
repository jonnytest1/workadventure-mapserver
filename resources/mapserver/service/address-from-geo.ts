
import { ResponseCodeError } from 'express-hibernate-wrapper';
import { Address } from '../models/address';
import { BoundingBox } from '../models/bounding-box';
import { GeoLocation } from '../models/location';
import { assignDeclaredProperties } from './json-assign';

const fetch = require('node-fetch');
export class AddressResolver {

    async getAddressFromGeo(location: GeoLocation): Promise<Address> {
        const data = await this.getData(location, 18);
        return assignDeclaredProperties(Address, data.address);
    }

    async getCountryData(location: GeoLocation): Promise<{ boundingbox: BoundingBox, svg: string }> {
        const data = await this.getData(location, 1);

        return {
            boundingbox: new BoundingBox(//
                new GeoLocation(data.boundingbox[0], data.boundingbox[2]),
                new GeoLocation(data.boundingbox[1], data.boundingbox[3])
            ),
            svg: data.svg
        };
    }

    async getData(location: GeoLocation, zoom: number) {
        const url = new URL('https://nominatim.openstreetmap.org/reverse.php?format=jsonv2');
        url.searchParams.set('lat', location.lat.toString());
        url.searchParams.set('lon', location.lon.toString());
        url.searchParams.set('zoom', `${zoom}`);
        const response = await fetch(url);
        const responseJson = await response.json();
        if (responseJson.error) {
            throw new ResponseCodeError(400, responseJson);
        }
        return responseJson;
    }
}