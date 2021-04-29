
// tslint:disable: variable-name
import { column, primary, table } from 'hibernatets';

@table()
export class Address {

    @primary()
    id: string;

    @column()
    house_number: string;
    @column()
    road: string;
    @column()
    suburb: string;
    @column()
    city: string;
    @column()
    state: string;
    @column()
    postcode: string;
    @column()
    country: string;
    @column()
    country_code: string;

}