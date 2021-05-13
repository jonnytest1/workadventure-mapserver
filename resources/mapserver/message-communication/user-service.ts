import { HttpRequest } from 'express-hibernate-wrapper';
import { MessageHandlerRegistration } from '../message-communication';
import { InventoryItem } from '../models/inventory-item';
import { InventoryItemType, inventoryTypeMap } from '../models/inventory-item-type';
import { User } from '../models/user';
import { UserAttributeMap } from '../models/user-attribute';
import { FriendshipService } from './friendship-service';

const properties = ['nickName', 'pusherUuid', 'autoOpenGameOverlay', 'shownCookieHint', 'trackedUser'] as const;
const publicUserAttributes = ['previousMap', 'items'] as const;
type userProsp<T extends ReadonlyArray<keyof User>> = T;
type userAttributes<T extends ReadonlyArray<keyof UserAttributeMap>> = T;
type TypeSafeUserProperties = userProsp<typeof properties>;
type TypeSafeUserAttributes = userAttributes<typeof publicUserAttributes>;
export type UserUpdateEvent = Partial<{
    [K in TypeSafeUserProperties[number]]: User[K]
}>;
export type FilteredUserAttributes = Partial<{
    [K in TypeSafeUserAttributes[number]]: UserAttributeMap[K]
}>;
/*extends { [key: keyof User] : any } {
    nickName?: string;
    uuid?: string;

    shownCookieHint?: boolean;

    autoOpenGameOverlay?: boolean;
}*/

@MessageHandlerRegistration
export class UserService {

    isPublicAttribute(key): key is keyof FilteredUserAttributes {
        return publicUserAttributes.includes(key);
    }

    incrementDeath(data: unknown, req: HttpRequest<User>) {
        req.user.deathCount++;
        return true;
    }

    userUpdate(data: UserUpdateEvent & Object, req: HttpRequest<User>) {

        for (let property of properties) {
            const prop: string = property;
            if (data.hasOwnProperty(property)) {
                req.user[prop] = data[prop];
            }
        }
        return true;
    }

    enableGameMode(data: unknown, req: HttpRequest<User>) {
        req.user.gameModeEnabled = true;
        return true;
    }
    setAttribute<K extends keyof UserAttributeMap>(data: {
        key: K,
        value: UserAttributeMap[K]
    }, req: HttpRequest<User>) {
        req.user.attributes.setValue(data.key, data.value);
        return true;
    }

    addItem(data, req: HttpRequest<User>) {
        req.user.inventory.push(new InventoryItem(InventoryItemType.Random));
    }

    async activateItem(data: { item: number }, req: HttpRequest<User>) {
        for (let item of req.user.inventory) {
            if (item.id === data.item) {
                inventoryTypeMap[item.itemType].activate(item, req.user);
                return item.publicItem();
            }
        }
    }

    async getUserData(data: unknown, req: HttpRequest<User>) {
        const attributesCopy: FilteredUserAttributes = {};
        req.user.attributes.forEachValue((value, key) => {
            if (this.isPublicAttribute(key)) {
                attributesCopy[key] = value as FilteredUserAttributes[typeof key];
            }
        });
        return {
            gameModeEnabled: req.user.gameModeEnabled,
            deathCount: req.user.deathCount,
            friends: await new FriendshipService().friendstatus(undefined, req),
            isAdmin: req.user.adminPrivileges,
            autoOpenGameOverlay: req.user.autoOpenGameOverlay,
            shownCookieHint: req.user.shownCookieHint,
            trackedUser: req.user.trackedUser,
            referenceUuid: req.user.referenceUuid,
            attributes: attributesCopy,
            inventory: req.user.inventory.map(item => item.publicItem())
        };
    }
}