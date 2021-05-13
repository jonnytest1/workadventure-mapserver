import { column, mapping, Mappings, primary, table } from 'hibernatets';
import { PrivateMapOverride } from './private-map-override';

@table()
export class UserMapAttributes {

    @primary()
    id;

    @column()
    userRef: string;

    @mapping(Mappings.OneToMany, PrivateMapOverride, 'userref')
    privateMapOverrides: Array<PrivateMapOverride> = [];
}