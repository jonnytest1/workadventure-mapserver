
///<reference path="../../jonny-maps/scripts/index.d.ts" />

setTimeout(async () => {
    //@ts-ignore
    const [{ getUserData }, { message, backendDomain }] = await Promise.all([require('./game/user-data.js'), require('./backend-connection')]);

    WA.registerMenuCommand('Register your own map -basintern', () => {
        WA.openTab(`${backendDomain}/mapserver/register.html`);
    });
    const userData = await getUserData();
    if(!userData.shownCookieHint) {
        setTimeout(() => {
            console.log('disabled');
            WA.sendChatMessage('you can register your own map in the game menu', 'map registration');
            WA.sendChatMessage('to go one level up there is an icon at the bottom left of each map !!!', 'map registration');
            //WA.disablePlayerControl()
            /*    let popup = WA.openPopup("first-start-popup", "welcome to the map :) © jonny", [{
                    label: "ok",
                    callback: () => {
                        //
                        popup.close();
                    }
                }])*/
            setTimeout(() => {
                // WA.restorePlayerControl()
            }, 3000);
            //
        }, 2000);
        message({
            type: 'userUpdate',
            data: {
                shownCookieHint: true
            }
        });
    }
}, 1000);