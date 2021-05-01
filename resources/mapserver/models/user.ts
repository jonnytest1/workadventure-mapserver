import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { FriendShip } from './friendship';

@table()
export class User {

    @primary()
    id: number;

    @column()
    cookie: string;

    @column()
    shownCookieHint = false;

    @column({ type: 'number' })
    readyForFriends: number;

    @mapping(Mappings.OneToMany, FriendShip, 'originalUser')
    friends: Array<FriendShip> = [];

    constructor(cookie?) {
        this.cookie = cookie;
    }

}

export interface UserRef extends User {
    //
}