import { HttpRequest } from 'express-hibernate-wrapper';
import { load } from 'hibernatets';
import { MessageHandlerRegistration } from '../message-communication';
import { FriendShip } from '../models/friendship';
import { User } from '../models/user';

@MessageHandlerRegistration
export class FriendshipService {
    async friendscheck(data: any, req: HttpRequest<User>) {
        const currentUserId = +req.user.id;
        const friendships = await load(FriendShip, 'originalUser = ?', [currentUserId], {
            deep: {
                'friendedUser': 'TRUE = TRUE'
            }
        });
        if (req.user.readyForFriends) {
            req.user.readyForFriends = Math.floor(Date.now() + (1000 * 10) / 1000);
        }
        return friendships.map(friendship => friendship.friendedUser.id);
    }

    async friendstatus(data, req: HttpRequest<User>) {
        return [];
    }

    async readyfriendship(data: any, req: HttpRequest<User>) {
        const readyUsers = await load(User, 'readyForFriends > ? ', [Math.floor(Date.now() / 1000)], {
            deep: {
                friends: 'TRUE=TRUE',
                friendedUser: {
                    depths: 4,
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
                newFriends.push(user.id);
            }

        }
        req.user.readyForFriends = Math.floor(Date.now() + (1000 * 10) / 1000);
        return {
            new: newFriends,
            friends: req.user.friends.map(friend => {
                return friend.friendedUser.id;
            })
        };

    }
    unreadyfriendship(data: any, req: HttpRequest<User>) {
        req.user.readyForFriends = null;
    }

}