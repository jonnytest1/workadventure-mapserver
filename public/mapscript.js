
///<reference path="../../jonny-maps/scripts/index.d.ts" />

/**
 * @type {import("../resources/mapserver/models/user").User}
 */

// @ts-ignore
const cookieContent = $COOKIE_CONTENT$;

setTimeout(() => {
    WA.registerMenuCommand('Register your own map -basintern', () => {
        WA.openTab('https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/register.html');
    });

    if(!cookieContent.shownCookieHint) {
        setTimeout(() => {
            console.log('disabled');
            WA.sendChatMessage('you can register your own map in the game menu', 'map registration');
            WA.sendChatMessage('to go one level up there is an icon at the bottom right of each map !!!', 'map registration');
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
    }
}, 1000);