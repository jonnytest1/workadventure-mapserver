import { HttpRequest } from 'express-hibernate-wrapper';
import { MessageHandlerRegistration } from '../message-communication';
import { InventoryItem, InventoryItemType } from '../models/inventory-item';
import { User } from '../models/user';
import { FriendshipService } from './friendship-service';

const properties = ['nickName', 'pusherUuid', 'autoOpenGameOverlay', 'shownCookieHint', 'trackedUser'] as const;

type userProsp<T extends ReadonlyArray<keyof User>> = T;

type TypeSafeUserProperties = userProsp<typeof properties>;
export type UserUpdateEvent = Partial<{
    [K in TypeSafeUserProperties[number]]: User[K]
}>;

/*extends { [key: keyof User] : any } {
    nickName?: string;
    uuid?: string;

    shownCookieHint?: boolean;

    autoOpenGameOverlay?: boolean;
}*/

@MessageHandlerRegistration
export class UserService {

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

    addItem(data, req: HttpRequest<User>) {
        req.user.inventory.push(new InventoryItem(InventoryItemType.Random))
    }

    async getUserData(data: unknown, req: HttpRequest<User>) {
        return {
            gameModeEnabled: req.user.gameModeEnabled,
            deathCount: req.user.deathCount,
            friends: await new FriendshipService().friendstatus(undefined, req),
            isAdmin: req.user.adminPrivileges,
            autoOpenGameOverlay: req.user.autoOpenGameOverlay,
            shownCookieHint: req.user.shownCookieHint,
            trackedUser: req.user.trackedUser,
            referenceUuid: req.user.referenceUuid
        };
    }
}