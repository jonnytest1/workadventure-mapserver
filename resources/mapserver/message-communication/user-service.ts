import { HttpRequest } from 'express-hibernate-wrapper';
import { MessageHandlerRegistration } from '../message-communication';
import { User } from '../models/user';
import { FriendshipService } from './friendship-service';

export interface UserUpdateEvent {
    nickName?: string;
    uuid?: string;

    autoOpenGameOverlay?: boolean;
}

@MessageHandlerRegistration
export class UserService {

    incrementDeath(data: unknown, req: HttpRequest<User>) {
        req.user.deathCount++;
    }

    userUpdate(data: UserUpdateEvent & Object, req: HttpRequest<User>) {
        for (let property of ['nickName', 'uuid', 'autoOpenGameOverlay']) {
            if (data.hasOwnProperty(property)) {
                req.user[property] = data[property];
            }
        }
    }

    enableGameMode(data: unknown, req: HttpRequest<User>) {
        req.user.gameModeEnabled = true;
    }

    async getUserData(data: unknown, req: HttpRequest<User>) {
        return {
            gameModeEnabled: req.user.gameModeEnabled,
            deathCount: req.user.deathCount,
            friends: await new FriendshipService().friendstatus(null, req),
            isAdmin: req.user.adminPrivileges,
            autoOpenGameOverlay: req.user.autoOpenGameOverlay
        };
    }
}