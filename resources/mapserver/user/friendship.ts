import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { UserRef } from '../user/user';

@table()
export class FriendShip {

    @primary()
    id: number;

    @column()
    originalUser: number;

    @mapping(Mappings.OneToOne, import('../user/user')
        .then(u => u.User), u => u.id)
    friendedUser: UserRef;

}