
///<reference path="../../jonny-maps/scripts/index.d.ts" />

setTimeout(async () => {
    //@ts-ignore
    const [{ getUserData }, { message, backendDomain }] = await Promise.all([
        require("@jonnygithub/game/user-data"),
        require('@jonnygithub/backend-connection')
    ]);

    WA.ui.registerMenuCommand('Register your own map -basintern', () => {
        WA.nav.openTab(`${backendDomain}/mapserver/register.html`);
    });
    const userData = await getUserData();
    if(!userData.shownCookieHint) {
        setTimeout(() => {
            console.log('disabled');
            WA.chat.sendChatMessage('you can register your own map in the game menu', 'jonnies map');
            WA.chat.sendChatMessage('to go one level up there is an icon at the bottom left of each map !!!', 'jonnies map');
            /*    let popup = WA.openPopup("first-start-popup", "welcome to the map :) © jonny", [{
                    label: "ok",
                    callback: () => {
                        //
                        popup.close();
                    }
                }])*/
            //
        }, 2000);
        message({
            type: 'userUpdate',
            data: {
                shownCookieHint: true,
            }
        });
    } else if(!userData.attributes.shownZoomUpUpdate) {
        WA.chat.sendChatMessage('the icon to go one level up is now in the bottom left', 'jonnies map');
    }
    message({
        type: "setAttribute",
        data: {
            key: "shownZoomUpUpdate",
            value: true
        }
    })
}, 1000);