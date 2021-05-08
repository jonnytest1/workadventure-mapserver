import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { ExtendedMap } from 'hibernatets/extended-map/extended-map';
import { v4 as uuid } from 'uuid';
import { FriendShip } from './friendship';
import { UserAttribute, UserAttributeMap } from './user-attribute';
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

    @mapping(Mappings.OneToMany, UserAttribute, 'userRef', {
        loadType: 'map'
    })
    attributes = new ExtendedMap<UserAttribute, UserAttributeMap>(UserAttribute);

    constructor(cookie?) {
        this.cookie = cookie;
        this.referenceUuid = uuid();
    }

}

export interface UserRef extends User {
    //
}