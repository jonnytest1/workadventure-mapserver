const url = new URL(location.href);
const apiToken = url.searchParams.get('apitoken');

onload = () => {
    setInterval(updateUsers(), 30000);
    setTimeout(() => {
        updateUsers();
    }, 10);
    document.title = 'Workadventure overview';
};

/**
 *
 * @param {string} token
 * @returns { Promise<import("./users").RoomMap>}
 */
async function fetchDump(token) {
    const response = await fetch(`${location.origin}/mapserver/rest/users?apikey=${token}`);
    return response.json();

}

function updateUsers() {
    return async () => {
        if(apiToken) {
            /**
             * @type {import("./users").RoomMap}
             */
            const json = await fetchDump(apiToken);

            const table = document.querySelector('table');
            for(let i = table.children.length - 1; i >= 1; i--) {
                table.children[i].remove();
            }
            let count = 0;
            for(let key in json) {
                const tableRow = document.createElement('tr');
                const roomName = document.createElement('td');
                const userContainerCell = document.createElement('td');
                roomName.textContent = json[key].slug;
                const userContainer = document.createElement('ul');
                userContainerCell.appendChild((userContainer));
                tableRow.appendChild(roomName);
                tableRow.appendChild(userContainerCell);
                for(const user of json[key].users) {
                    count++;
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
                    if(user.jitsiRoom) {
                        userEntry.textContent += ' - jitsi:' + user.jitsiRoom;
                    }
                    userContainer.appendChild(userEntry);

                }
                table.appendChild(tableRow);
            }

            document.title = `${count} Workadventure`
            window.parent.postMessage(JSON.stringify({
                title: document.title
            }), "*")


            const after = document.createElement('tr');
            after.innerHTML = `<td>lastcheck : ${new Date().toLocaleTimeString()}</td>`;
            table.appendChild(after);
        }

    };
}
