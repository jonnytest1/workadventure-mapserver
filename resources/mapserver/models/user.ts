import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { v4 as uuid } from 'uuid';
import { FriendShip } from './friendship';
@table()
export class User {

    @primary()
    id: number;

    @column()
    cookie: string;
    @column()
    pusherUuid: string;

    @column()
    nickName: string;

    @column()
    shownCookieHint = false;

    @column({ type: 'number' })
    readyForFriends: number;

    @column({ type: 'number' })
    deathCount: number = 0;

    @mapping(Mappings.OneToMany, FriendShip, 'originalUser')
    friends: Array<FriendShip> = [];

    @column({ type: 'boolean' })
    adminPrivileges: boolean;

    @column({ type: 'boolean' })
    gameModeEnabled: boolean;

    @column({ type: 'boolean' })
    autoOpenGameOverlay: boolean;

    @column()
    trackedUser: string;

    @column()
    referenceUuid: string;

    constructor(cookie?) {
        this.cookie = cookie;
        this.referenceUuid = uuid();
    }

}

export interface UserRef extends User {
    //
}