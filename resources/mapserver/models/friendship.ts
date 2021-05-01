import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { UserRef } from './user';

@table()
export class FriendShip {

    @primary()
    id: number;

    @column()
    originalUser: number;

    @mapping(Mappings.OneToOne, import('./user')
        .then(u => u.User), u => u.id)
    friendedUser: UserRef;
}