import { HttpRequest } from 'express-hibernate-wrapper';
import { MessageHandlerRegistration } from '../message-communication';
import { User } from '../models/user';

export interface UserUpdateEvent {
    nickName: string;
    uuid: string;
}

@MessageHandlerRegistration
export class UserService {

    incrementDeath(data: unknown, req: HttpRequest<User>) {
        req.user.deathCount++;
    }

    userUpdate(data: UserUpdateEvent, req: HttpRequest<User>) {
        req.user.nickName = data.nickName;
        req.user.pusherUuid = data.uuid;
    }

    enableGameMode(data: unknown, req: HttpRequest<User>) {
        req.user.gameModeEnabled = true;
    }

    getUserData(data: unknown, req: HttpRequest<User>) {
        return {
            gameModeEnabled: req.user.gameModeEnabled,
            deathCount: req.user.deathCount,
        };
    }
}