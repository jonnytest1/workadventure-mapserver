import { HttpRequest } from 'express-hibernate-wrapper';
import { load } from 'hibernatets';
import { Position } from '../../../public/users';
import { ApiProxy } from '../api.proxy';
import { MessageCommunciation, MessageHandlerRegistration } from '../message-communication';
import { FriendShip } from '../models/friendship';
import { User } from '../models/user';

interface FriendMap {
    [nickname: string]: {
        status: 'offline' | 'online',
        index: number
        position?: Position,
        room?: string
        jitsiRoom?: string,
        joinedAt?: string,
        referenceUuid: string
    };
}

const apiProxy = new ApiProxy();
@MessageHandlerRegistration
export class FriendshipService {
    async friendscheck(data: unknown, req: HttpRequest<User>) {
        const currentUserId = +req.user.id;
        const friendships = await load(FriendShip, 'originalUser = ?', [currentUserId], {
            deep: {
                'friendedUser': 'TRUE = TRUE'
            }
        });
        if (req.user.readyForFriends) {
            req.user.readyForFriends = Math.floor((Date.now() + (1000 * 10)) / 1000);
        }
        return friendships.map(friendship => friendship.friendedUser.nickName);
    }

    async friendstatus(data: { withAdmin?: boolean } = {}, req: HttpRequest<User>): Promise<FriendMap> {
        const map = await apiProxy.getUserMap(true);

        const friiendMap: FriendMap = {};
        req.user.friends.forEach((friend, index) => {
            friiendMap[friend.friendedUser.nickName] = {
                status: 'offline',
                index: index + 1,
                referenceUuid: friend.friendedUser.referenceUuid
            };
        });
        for (let room in map) {
            const roomData = map[room];

            for (let user of roomData.users) {
                const friend = req.user.friends.find(friendShip => friendShip.friendedUser.pusherUuid === user.pusherUuid);
                if (friend || (req.user.adminPrivileges && data.withAdmin)) {
                    if (!friiendMap[user.name]) {
                        friiendMap[user.name] = { index: -1, status: 'online', referenceUuid: null };
                    }
                    friiendMap[user.name].position = user.position;
                    friiendMap[user.name].jitsiRoom = user.jitsiRoom;
                    friiendMap[user.name].joinedAt = user.joinedAt;
                    friiendMap[user.name].status = 'online';
                    friiendMap[user.name].room = room;
                }
            }
        }
        return friiendMap;
    }

    async readyfriendship(data: unknown, req: HttpRequest<User>) {
        const readyUsers = await load(User, 'readyForFriends > ? ', [Math.floor(Date.now() / 1000)], {
            deep: {
                friends: 'TRUE=TRUE',
                friendedUser: {
                    depths: 6,
                    filter: 'TRUE=TRUE'
                }
            }
        });

        const newFriends = [];
        for (const user of readyUsers) {
            const alreadyHasFriendWithId = user.friends.some(friend => {
                return friend.friendedUser.id === req.user.id;
            });
            if (user.id !== req.user.id && !alreadyHasFriendWithId) {
                const friendship = new FriendShip();
                friendship.friendedUser = req.user;
                user.friends.push(friendship);

                const friendshipCurrentUser = new FriendShip();
                friendshipCurrentUser.friendedUser = user;
                req.user.friends.push(friendshipCurrentUser);
                newFriends.push(user.nickName);
            }

        }
        req.user.readyForFriends = Math.floor((Date.now() + (1000 * 10)) / 1000);
        return {
            new: newFriends,
            friends: req.user.friends.map(friend => {
                return friend.friendedUser.nickName;
            })
        };

    }
    unreadyfriendship(data: unknown, req: HttpRequest<User>) {
        req.user.readyForFriends = null;
        return true;
    }

    async chatmessage(data: { message: string }, req: HttpRequest<User>, ws) {
        const messageParts = data.message.trim()
            .split(' ');
        const index = messageParts.shift();
        const message = messageParts.join(' ');
        if (index === 'global') {
            if (req.user.adminPrivileges) {
                MessageCommunciation.sendToAllUsers({
                    type: 'receivemessage',
                    author: req.user.nickName + ' - global',
                    message: message
                });
            }
        } else {
            const friendId = req.user.friends[+index - 1].friendedUser.id;
            MessageCommunciation.sendToUserById(friendId, {
                type: 'receivemessage',
                author: req.user.nickName,
                message: message
            });
        }
        return true;

    }
}