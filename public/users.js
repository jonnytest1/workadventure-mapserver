/// <reference path="users.d.ts" />
const url = new URL(location.href);
const apiToken = url.searchParams.get('apitoken');

/**
 * @type {{[room:string]:MapJson}}
 */
const roomJsons = {};

onload = () => {
    setInterval(updateUsers(), 3000);
    setTimeout(() => {
        updateUsers();
    }, 10);
    document.title = 'Workadventure overview';
};

function updateUsers() {
    return async () => {
        if(apiToken) {
            /**
             * @type {RoomMap}
             */
            const json = await getUsers(apiToken);

            const table = document.querySelector('table');
            for(let i = table.children.length - 1; i >= 1; i--) {
                table.children[i].remove();
            }
            for(let key in json) {

                if(!roomJsons[key]) {
                    const response = await fetch('https://' + key.replace('_/global/', ''));
                    roomJsons[key] = await response.json();
                }

                const tableRow = document.createElement('tr');
                const roomName = document.createElement('td');
                const userContainerCell = document.createElement('td');
                roomName.textContent = json[key].slug;
                const userContainer = document.createElement('ul');
                userContainerCell.appendChild((userContainer));
                tableRow.appendChild(roomName);
                tableRow.appendChild(userContainerCell);
                for(const user of json[key].users) {

                    const userEntry = document.createElement('li');

                    const joinedAt = new Date(user.joinedAt);

                    let duration = Math.floor((Date.now() - joinedAt.valueOf()) / 1000);
                    let seconds = duration % 60;
                    let minutes = Math.floor(duration / 60);
                    let hours = Math.floor(minutes / 60);
                    minutes = (minutes % 60);

                    const minuteStr = minutes.toString()
                        .padStart(2, '0');

                    const secondStr = seconds.toString()
                        .padStart(2, '0');

                    let hourStr = '';
                    if(hours > 0) {
                        hourStr = hours + ':';
                    }

                    let durationStr = `${hourStr}${minuteStr}:${secondStr}`;
                    if(durationStr.includes('NaN')) {
                        durationStr = '∞';
                    }

                    userEntry.textContent = `${user.name} - ${durationStr} - ${JSON.stringify(user.position ? { x: user.position.x, y: user.position.y } : null)}`;
                    const jitsiId = getJitsiKeyForPosition(key, user.position);
                    if(jitsiId) {
                        userEntry.textContent += ' - jitsi:' + jitsiId;
                    }
                    userContainer.appendChild(userEntry);

                }
                table.appendChild(tableRow);
            }

            const after = document.createElement('tr');
            after.innerHTML = `<td>lastcheck : ${new Date().toLocaleTimeString()}</td>`;
            table.appendChild(after);
        }

    };
}

/**
 *
 * @param {string} room
 * @param {Postion} position
 */
function getJitsiKeyForPosition(room, position) {
    const playerX = position.x / 32;
    const playery = position.y / 32;
    for(const layer of roomJsons[room].layers) {
        if(!layer.properties) {
            continue;
        }
        const jitsiRoomName = layer.properties.find(prop => prop.name === 'jitsiRoom');
        if(jitsiRoomName) {
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
            if(topLeft.x < playerX && bottomRight.x > playerX) {
                if(topLeft.y < playery && bottomRight.y > playery) {
                    return jitsiRoomName.value;
                }
            }
        }
    }
    return null;
}

/**
 *
 * @param {string} token
 * @returns { Promise<RoomDump>}
 */
async function fetchDump(token) {
    const response = await fetch('https://workadventure-api.brandad-systems.de/dump?token=' + token);
    return response.json();

}
/**
 *
 * @param {string} token
 * @returns { Promise<RoomMap>}
 */
async function getUsers(token) {
    const dump = await fetchDump(token);
    /**
     * @type {RoomMap}
     */
    const roomMap = {};

    /**
     *
     * @param {UserObj} user
     * @param {Array<ApiUser>} userList
     */
    function parseUser(user, userList) {
        if(typeof user === 'string') {
            return;
        }
        userList.push({
            name: user.name,
            joinedAt: user.joinedAt,
            position: user.position
        });
        if(user.positionNotifier && user.positionNotifier.zones) {
            for(let zoneTop of user.positionNotifier.zones) {
                if(zoneTop) {
                    for(let zoneInner of zoneTop) {
                        if(zoneInner && zoneInner.things) {
                            for(const thing of zoneInner.things) {
                                parseUser(thing, userList);
                            }
                        }
                    }
                }
            }
        }
    }

    for(let room in dump) {
        if(!roomMap[room]) {
            roomMap[room] = {
                slug: dump[room].roomSlug,
                users: []
            };
        }

        for(let index in dump[room].users) {
            const dumpUser = dump[room].users[index];
            parseUser(dumpUser, roomMap[room].users);
        }
    }
    return roomMap;
}