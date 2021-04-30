
///<reference path="wa.d.ts" />

/**
 * @type {import("../resources/mapserver/models/user").User}
 */

// @ts-ignore
const cookieContent = $COOKIE_CONTENT$;

/**
 *
 * @param {any} data
 *
 */
async function message(data) {
    return new Promise((resolv, thrower) => {
        const img = document.createElement('iframe');
        window.onmessage = (messageEvent) => {
            if(messageEvent.data.type === 'iframeresponse') {
                resolv(messageEvent.data.data);
                img.remove();
            }
        };
        img.src = `https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/rest/mapserver/message/${btoa(JSON.stringify(data))}/message.png`;
        document.body.appendChild(img);
    });
}

/*message({ test: "hallo" }).then(data => {
    debugger;
})*/

setTimeout(() => {
    WA.registerMenuCommand('Register your own map -basintern', () => {
        WA.openTab('https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/register.html');
    });

    if(!cookieContent.shownCookieHint) {
        WA.sendChatMessage('you can register your own map in the game menu', 'map registration');
        WA.sendChatMessage('to go one level up there is an icon at the bottom right of each map !!!', 'map registration');
    }
}, 100);
