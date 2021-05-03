import base64url from 'base64url';
import { GET, HttpRequest, HttpResponse, WS } from 'express-hibernate-wrapper/';
import { User } from './models/user';

const messageHandlers: { [eventType: string]: (data: any, req: HttpRequest, ws?) => any } = {};

export function MessageHandlerRegistration(constructor: new () => any) {
    const messageHandler = new constructor();
    const messageHandlerProto = Object.getPrototypeOf(messageHandler);
    for (let name of Object.getOwnPropertyNames(messageHandlerProto)) {
        if (name !== 'constructor') {
            console.log(`registering message Handler for ${name}`);
            messageHandlers[name] = messageHandlerProto[name].bind(messageHandler);
        }
    }
}

@WS('message')
export class MessageCommunciation {

    static websockets: { [uuid: string]: any } = {};

    @GET('message/:data/message.png')
    async onmessage(req: HttpRequest, res: HttpResponse) {
        const data = JSON.parse(base64url.decode(req.params.data));
        console.log(data.type);
        const responseJson = await messageHandlers[data.type]({ ...data.data }, req);
        const jsonStr = JSON.stringify(responseJson);
        res.set('Content-Type', 'text/html')
            .send(`<script>const jsonV=${jsonStr};window.parent.postMessage({data:jsonV,type:"iframeresponse"},"*")</script>`);
    }

    static onConnected(req: HttpRequest<User>, ws) {
        const userId = req.user.id;
        this.websockets[userId] = ws;
        ws.onclose = () => {
            delete this.websockets[userId];
        };

        ws.onmessage = async message => {
            const data = JSON.parse(message.data);
            if (data.type === '__proto__') {
                return;
            }
            const responseJson = await messageHandlers[data.type]({ ...data.data }, req, ws);
            if (responseJson !== undefined) {
                ws.send(responseJson);
            }
        };
    }
}