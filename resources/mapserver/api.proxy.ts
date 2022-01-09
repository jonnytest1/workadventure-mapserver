import { GET, HttpRequest, HttpResponse } from 'express-hibernate-wrapper';
import { DataBaseBase } from 'hibernatets/mariadb-base';
import { ApiUser, Layer, MapJson, Position, RoomMap, UserObj } from '../../public/users';
import { MemoryCache } from '../../util/memory-cache';
import { MessageCommunciation } from './message-communication';
//const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = require('node-fetch');
export class ApiProxy {

    static roomJsons = new MemoryCache<MapJson>({
        duration: 1000 * 60 * 60,
        generator: async key => {
            const finalMapUrl = 'https://' + key.replace('_/global/', '');
            if (!finalMapUrl.includes('localhost')) {
                const response = await fetch(finalMapUrl);
                return response.json();
            }
            return null;
        }
    });

    private static pusherIdCache = new MemoryCache<string>({
        duration: 1000 * 60 * 60,
        multipleGenerator: async pusherUuids => {
            console.log("fetching pusherUuids");
            const queryResult = await new DataBaseBase()
                .selectQuery<{ pusherUuid: string, referenceUuid: string }>('SELECT referenceUuid,pusherUuid FROM user WHERE `pusherUuid` IN (?)', [pusherUuids]);

            const tempMap = {};
            queryResult.forEach(result => {
                tempMap[result.pusherUuid] = result.referenceUuid;
            });
            return tempMap;
        }
    })

    static apiCache = null;

    fetchAnyways: number = 1

    constructor() {
        this.userDumpLoop();
    }

    async userDumpLoop() {
        try {
            if (this.fetchAnyways > 0 || MessageCommunciation.hasUsers()) {
                const response = await fetch(`https://${process.env.API_ORIGIN}/dump?token=${process.env.ADMIN_API_KEY}`);
                ApiProxy.apiCache = await response.json();
                await MessageCommunciation.sendForAllUsersByPusherId(async pusherUuid => {
                    const apiUsers = await this.getAllUsersForPusherId(pusherUuid);
                    if (apiUsers.length <= 1) {
                        return null;
                    }

                    return {
                        type: 'positionUpdate',
                        data: apiUsers
                    };
                });
                this.fetchAnyways = MessageCommunciation.hasUsers() ? 10 : this.fetchAnyways - 1;
            }
            //fetching every 10 minutes anyways
            if (this.fetchAnyways < (60 * 10)) {
                this.fetchAnyways = 1;
            }
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => {
            this.userDumpLoop();
        }, 10000);
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
            }

            for (let index in dump[room].users) {
                const dumpUser = dump[room].users[index];
                await this.parseUser(dumpUser, roomMap[room].users, userObjectMap, room);
            }
        }

        const pusherKeys = [...userObjectMap.keys()];

        const keyMap = await ApiProxy.pusherIdCache.getAll(pusherKeys);

        pusherKeys.forEach(pusherKey => {
            userObjectMap.get(pusherKey).userRefereneUuid = keyMap[pusherKey];
        });

        if (!containsIds) {
            userObjectMap.forEach(uO => {
                delete uO.pusherUuid;
            });
        }
        return roomMap;
    }

    private async parseUser(user: UserObj, userList: Array<ApiUser>, glboalUserMap: Map<string, ApiUser>, room: string) {
        if (typeof user === 'string') {
            return;
        }

        const userObj: ApiUser = {
            name: user.name,
            joinedAt: user.joinedAt,
            position: user.position,
            jitsiRoom: await this.getJitsiKeyForPosition(room, user.position),
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
                                await this.parseUser(thing, userList, glboalUserMap, room);
                            }
                        }
                    }
                }
            }
        }
    }

    async getJitsiKeyForPosition(room, position: Position) {
        if (!position) {
            return null;
        }
        const playerX = position.x / 32;
        const playery = position.y / 32;

        const map = await ApiProxy.roomJsons.get(room);
        if (!map) {
            return 'invalidmapref';
        }

        if (!(map.layers instanceof Array)) {
            console.log('layers is no array');
            return null;
        }
        for (const layer of map.layers) {
            if (!layer.properties && layer.type !== "group") {
                continue;
            }
            const jitisName = this.getJitsiNameFromLayer(layer, playerX, playery);
            if (jitisName) {
                return jitisName;
            }
        }
        return null;
    }

    getJitsiNameFromLayer(layer: Layer, playerX, playery) {

        if (layer.properties) {
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
        if (layer.layers) {
            for (const subLayer of layer.layers) {
                const jitsiName = this.getJitsiNameFromLayer(subLayer, playerX, playery);
                if (jitsiName) {
                    return jitsiName;
                }
            }
        }
        return null;
    }
}