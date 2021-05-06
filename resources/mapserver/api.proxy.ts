import { GET, HttpRequest, HttpResponse } from 'express-hibernate-wrapper';
import { ApiUser, MapJson, Position, RoomMap, UserObj } from '../../public/users';
const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = require('node-fetch');
export class ApiProxy {

    static roomJsons: { [room: string]: MapJson } = {};

    @GET('/users')
    async getUsers(req: HttpRequest, res: HttpResponse) {
        const userMap = await this.getUserMap();
        res.send(userMap);
    }

    async getUserMap(containsIds = false) {
        const response = await fetch('https://workadventure-api.brandad-systems.de/dump?token=' + process.env.ADMIN_API_KEY);
        const dump = await response.json();
        return this.getUsersFromDump(dump, containsIds);
    }

    async getUsersFromDump(dump, containsIds): Promise<RoomMap> {
        const roomMap: RoomMap = {};
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
                this.parseUser(dumpUser, roomMap[room].users, room, containsIds);
            }
        }
        return roomMap;
    }

    parseUser(user: UserObj, userList: Array<ApiUser>, room: string, containsIds: boolean) {
        if (typeof user === 'string') {
            return;
        }
        userList.push({
            name: user.name,
            joinedAt: user.joinedAt,
            position: user.position,
            jitsiRoom: this.getJitsiKeyForPosition(room, user.position),
            uuid: containsIds ? user.uuid : undefined

        });
        if (user.positionNotifier && user.positionNotifier.zones) {
            for (let zoneTop of user.positionNotifier.zones) {
                if (zoneTop) {
                    for (let zoneInner of zoneTop) {
                        if (zoneInner && zoneInner.things) {
                            for (const thing of zoneInner.things) {
                                this.parseUser(thing, userList, room, containsIds);
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