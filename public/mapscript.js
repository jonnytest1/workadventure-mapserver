
///<reference path="../../workadventure-map-starter-kit/workadventuremap/scripts/index.d.ts" />

/**
 * @type {import("../resources/mapserver/models/user").User}
 */

// @ts-ignore
const cookieContent = $COOKIE_CONTENT$;

/**
 * @template {keyof msgCpy} T
 * @param {{
 *      type:T,
 *      data?:msgCpy[T]["param"]
 * }} data
 * @returns {Promise<msgCpy[T]["response"]>}
 */
async function message(data) {
    /**
     * @type {Promise<msgCpy[T]["response"]>}
     */
    const pr = new Promise((resolv, thrower) => {
        const img = document.createElement('iframe');
        window.onmessage = (messageEvent) => {
            /**
             * @type {{type:"iframeresponse",data:msgCpy[T]["response"]}}
             */
            let eventData = messageEvent.data;
            if(eventData.type === 'iframeresponse') {
                resolv(eventData.data);
                img.remove();
            }
        };
        img.src = `https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/rest/message/${btoa(JSON.stringify(data))}/message.png`;
        document.body.appendChild(img);
    });

    return pr;
}

/*message({ test: "hallo" }).then(data => {
    debugger;
})*/

setTimeout(() => {
    WA.registerMenuCommand('Register your own map -basintern', () => {
        WA.openTab('https://pi4.e6azumuvyiabvs9s.myfritz.net/mapserver/register.html');
    });

    if(!cookieContent.shownCookieHint) {
        setTimeout(() => {
            console.log("disabled")
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
            }, 3000)
            //
            // 

        }, 2000)


    }

}, 1000);

addEventListener('load', () => {
    setTimeout(async () => {
        const state = await WA.getGameState();
        await message({
            type: 'userUpdate',
            data: {
                uuid: state.uuid,
                nickName: state.nickName
            }
        });
    }, 2000);

});
