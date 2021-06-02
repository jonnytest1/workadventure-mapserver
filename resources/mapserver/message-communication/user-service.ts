import { HttpRequest } from 'express-hibernate-wrapper';
//import { load, save } from 'hibernatets';
import { MessageHandlerRegistration } from '../message-communication';
import { InventoryItem } from '../user/inventory/inventory-item';
import { inventoryActivationMap, ItemActivationData } from '../user/inventory/inventory-item-activation';
import { InventoryItemType } from '../user/inventory/inventory-item-type';
import { RemoveItem } from '../user/inventory/remove-item-error';
import { User } from '../user/user';
import { UserAttributeMap } from '../user/user-attribute';
import { FriendshipService } from './friendship-service';

const properties = ['nickName', 'pusherUuid', 'autoOpenGameOverlay', 'shownCookieHint', 'trackedUser'] as const;
const publicUserAttributes = ['previousMap', 'items', "shownZoomUpUpdate"] as const;
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

    addItem(data: { count?: number } = {}, req: HttpRequest<User>) {
        if (!data.count || data.count > 10) {
            data.count = 1;
        }
        for (let i = 0; i < data.count; i++) {
            req.user.inventory.push(new InventoryItem(InventoryItemType.Random));
        }
    }

    async activateItem(data: ItemActivationData, req: HttpRequest<User>): Promise<Array<ReturnType<InventoryItem['publicItem']>>> {
        for (let item of req.user.inventory) {
            if (item.id === data.item) {
                try {
                    await inventoryActivationMap[item.itemType].activate(item, req.user, data);
                } catch (e) {
                    if (e instanceof RemoveItem) {
                        req.user.inventory.filter(invItem => invItem.id !== item.id);
                        return [];
                    } else {
                        throw e;
                    }
                }
                return [item.publicItem()];
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