import { load, save } from 'hibernatets';
import { UserMapAttributes } from './user-map-attributes';

export async function userAttributesForUserRefUuid(userReferenceUuid: string): Promise<UserMapAttributes> {
    let attributes = await load(UserMapAttributes, a => a.userRef = userReferenceUuid, undefined, { first: true, deep: true });
    if (!attributes) {
        attributes = new UserMapAttributes();
        attributes.userRef = userReferenceUuid;
        save(attributes);
    }
    return attributes;
}