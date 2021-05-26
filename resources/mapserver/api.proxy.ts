import { GET, HttpRequest, HttpResponse } from 'express-hibernate-wrapper';
import { DataBaseBase } from 'hibernatets/mariadb-base';
import { ApiUser, MapJson, Position, RoomMap, UserObj } from '../../public/users';
import { MessageCommunciation } from './message-communication';
//const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = require('node-fetch');
export class ApiProxy {

    static roomJsons: { [room: string]: MapJson } = {};

    private static pusherIdCache: {
        [pusherId: string]: {
            timestamp: number,
            userRef: string
        }
    } = {};

    static apiCache = null;

    fetchAnyways: number = 1

    constructor() {
        setInterval(async () => {
            if (this.fetchAnyways > 0 || MessageCommunciation.hasUsers()) {
                const response = await fetch('https://workadventure-api.brandad-systems.de/dump?token=' + process.env.ADMIN_API_KEY);
                ApiProxy.apiCache = await response.json();
                MessageCommunciation.sendForAllUsersByPusherId(async pusherUuid => {
                    const apiUsers = await this.getAllUsersForPusherId(pusherUuid);
                    if (apiUsers.length <= 1) {
                        return null;
                    }

                    return {
                        type: 'positionUpdate',
                        data: apiUsers
                    };
                });
                this.fetchAnyways = MessageCommunciation.hasUsers() ? 5 : this.fetchAnyways - 1
            }
        }, 1000);
    }

    async getAllUsersForPusherId(pusherId: string) {
        const roomMap = await this.getUserMap(true);
        for (let i in roomMap) {
            if (roomMap[i].users.find(user => user.pusherUuid === pusherId)) {
                return roomMap[i].users;
            }
        }
        return [];
    }

    @GET('/users')
    async getUsers(req: HttpRequest, res: HttpResponse) {
        const userMap = await this.getUserMap();
        res.send(userMap);
    }

    async getUserMap(containsIds = false) {
        return this.getUsersFromDump(ApiProxy.apiCache, containsIds);
    }

    private async getUsersFromDump(dump, containsIds): Promise<RoomMap> {
        const roomMap: RoomMap = {};
        const userObjectMap: Map<string, ApiUser> = new Map();
        for (let room in dump) {
            if (!roomMap[room]) {
                roomMap[room] = {
                    slug: dump[room].roomSlug,
                    users: []
                };

                if (!ApiProxy.roomJsons[room]) {
                    const finalMapUrl = 'https://' + room.replace('_/global/', '');
                    if (!finalMapUrl.includes('localhost')) {
                        const response = await fetch(finalMapUrl);
                        ApiProxy.roomJsons[room] = await response.json();
                    }

                }
            }

            for (let index in dump[room].users) {
                const dumpUser = dump[room].users[index];
                this.parseUser(dumpUser, roomMap[room].users, userObjectMap, room);
            }
        }

        const pusherKeys = [...userObjectMap.keys()];
        const pusherUuids = pusherKeys.filter(uuid => {
            if (!ApiProxy.pusherIdCache[uuid]) {
                return true;
            }
            if (ApiProxy.pusherIdCache[uuid].timestamp < (Date.now() - (1000 * 60 * 5))) {
                return true;
            }
            return false;
        });
        if (pusherUuids.length) {
            const queryResult = await new DataBaseBase()
                .selectQuery<{ pusherUuid: string, referenceUuid: string }>('SELECT referenceUuid,pusherUuid FROM user WHERE `pusherUuid` IN (?)', [pusherUuids]);

            for (const obj of queryResult) {
                ApiProxy.pusherIdCache[obj.pusherUuid] = {
                    timestamp: Date.now(),
                    userRef: obj.referenceUuid
                };
            }
        }
        pusherKeys.forEach(pusherKey => {
            if (!ApiProxy.pusherIdCache[pusherKey]) {
                ApiProxy.pusherIdCache[pusherKey] = {
                    timestamp: Date.now() - (1000 * 60 * 2),
                    userRef: null
                };
            }
            userObjectMap.get(pusherKey).userRefereneUuid = ApiProxy.pusherIdCache[pusherKey].userRef;
        });
        if (!containsIds) {
            userObjectMap.forEach(uO => {
                delete uO.pusherUuid;
            });
        }
        return roomMap;
    }

    private parseUser(user: UserObj, userList: Array<ApiUser>, glboalUserMap: Map<string, ApiUser>, room: string) {
        if (typeof user === 'string') {
            return;
        }

        const userObj: ApiUser = {
            name: user.name,
            joinedAt: user.joinedAt,
            position: user.position,
            jitsiRoom: this.getJitsiKeyForPosition(room, user.position),
            pusherUuid: user.uuid,
            userRefereneUuid: null
        };
        userList.push(userObj);
        glboalUserMap.set(user.uuid, userObj);

        if (user.positionNotifier && user.positionNotifier.zones) {
            for (let zoneTop of user.positionNotifier.zones) {
                if (zoneTop) {
                    for (let zoneInner of zoneTop) {
                        if (zoneInner && zoneInner.things) {
                            for (const thing of zoneInner.things) {
                                this.parseUser(thing, userList, glboalUserMap, room);
                            }
                        }
                    }
                }
            }
        }
    }

    getJitsiKeyForPosition(room, position: Position) {
        if (!position) {
            return null;
        }
        const playerX = position.x / 32;
        const playery = position.y / 32;

        if (!ApiProxy.roomJsons[room]) {
            return 'invalidmapref';
        }

        if (!(ApiProxy.roomJsons[room].layers instanceof Array)) {
            console.log('layers is no array');
            return null
        }
        for (const layer of ApiProxy.roomJsons[room].layers) {
            if (!layer.properties) {
                continue;
            }
            const jitsiRoomName = layer.properties.find(prop => prop.name === 'jitsiRoom');
            if (jitsiRoomName) {
                const firstIndex = layer.data.findIndex(num => num !== 0);
                const lastIndex = layer.data.lastIndexOf(layer.data[firstIndex]);
                const topLeft = {
                    x: (firstIndex % layer.width),
                    y: Math.floor(firstIndex / layer.width)
                };
                const bottomRight = {
                    y: Math.floor(lastIndex / layer.width) + 1,
                    x: (lastIndex % layer.width) + 1
                };
                if (topLeft.x < playerX && bottomRight.x > playerX) {
                    if (topLeft.y < playery && bottomRight.y > playery) {
                        return jitsiRoomName.value;
                    }
                }
            }
        }
        return null;
    }

}