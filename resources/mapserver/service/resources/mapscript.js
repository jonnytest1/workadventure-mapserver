
///<reference path="wa.d.ts" />

/**
 * @type {import("../../models/user").User}
 */

// @ts-ignore
const cookieContent = $COOKIE_CONTENT$;

setTimeout(() => {
    WA.registerMenuCommand('Register your own map -basintern', () => {
        WA.openTab('https://pi4.e6azumuvyiabvs9s.myfritz.net/nodetype/rest/mapserver');
    });

    if(!cookieContent.shownCookieHint) {
        WA.sendChatMessage('you can register your own map in the game menu', 'map registration');
        WA.sendChatMessage('to go one level up there is an icon at the bottom right of each map !!!', 'map registration');
    }
}, 100);
