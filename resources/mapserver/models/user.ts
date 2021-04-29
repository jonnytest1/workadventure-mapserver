import { column, primary, table } from 'hibernatets';

@table()
export class User {

    @primary()
    id: number;

    @column()
    cookie: string;

    @column()
    shownCookieHint = false;

    constructor(cookie?) {
        this.cookie = cookie;
    }

}