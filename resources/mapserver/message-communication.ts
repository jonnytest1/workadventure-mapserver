import base64url from 'base64url';
import { GET, HttpRequest, HttpResponse, Websocket, WS } from 'express-hibernate-wrapper/';
import { User } from './models/user';

const messageHandlers: { [eventType: string]: (data: any, req: HttpRequest, ws?) => any } = {
    cookie: () => true
};

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

    static websockets: {
        [uuid: string]: {
            ws: Websocket,
            user: User
            pusherUuid: string
        }
    } = {};

    @GET('message/:data/message.html')
    async onmessage(req: HttpRequest, res: HttpResponse) {
        const data = JSON.parse(base64url.decode(req.params.data));
        console.log(data.type);
        const responseJson = await messageHandlers[data.type]({ ...data.data }, req);
        const jsonStr = JSON.stringify(responseJson);
        res.set('Content-Type', 'text/html')
            .send(`<script>const jsonV=${jsonStr};window.parent.postMessage({data:jsonV,type:"iframeresponse"},"*")</script>`);
    }

    static sendToUserById(userId: number, message: any): boolean {
        if (!MessageCommunciation.websockets[userId]) {
            return false;
        }
        MessageCommunciation.websockets[userId].ws.send(JSON.stringify(message));
        return true;
    }

    static sendForAllUsersByPusherId(callback: (pusherId: string) => any) {
        Object.keys(MessageCommunciation.websockets)

            .forEach(async userId => {
                const websocketObj = MessageCommunciation.websockets[userId];
                const objectToSend = await callback(websocketObj.pusherUuid);
                if (objectToSend != null) {
                    websocketObj.ws.send(JSON.stringify(objectToSend));
                }

            });

    }

    static sendToUserByPusherUuid(pusherId: string, message: any): boolean {
        let ws;
        for (let i in MessageCommunciation.websockets) {
            if (MessageCommunciation.websockets[i].pusherUuid === pusherId) {
                ws = MessageCommunciation.websockets[i].ws;
            }
        }
        if (!ws) {
            return false;
        }
        ws.send(JSON.stringify(message));
        return true;
    }
    static sendToAllUsers(message: any): number {
        let ct = 0;
        for (let i in MessageCommunciation.websockets) {
            MessageCommunciation.websockets[i].ws.send(JSON.stringify(message));
            ct++;
        }
        return ct;
    }

    static onConnected(req: HttpRequest<User>, ws: Websocket) {
        const userId = req.user.id;
        this.websockets[userId] = { ws: ws, pusherUuid: req.user.pusherUuid, user: req.user };

        ws.on('close', () => {
            delete this.websockets[userId];
        });
        ws.on('error', e => {
            console.error(e);
        });
        ws.on('message', async message => {
            try {
                console.log('received', message);
                const data = JSON.parse(message);
                if (data.type === '__proto__') {
                    return;
                }
                req.user = this.websockets[userId].user;
                const responseJson = await messageHandlers[data.type]({ ...data.data }, req, ws);

                if (responseJson !== undefined) {
                    console.log('returning', responseJson, message);
                    ws.send(JSON.stringify({
                        data: responseJson,
                        type: 'websocketresponse',
                        uuid: data.uuid || undefined
                    }));
                }
            } catch (e) {
                console.error(e);
            }
        });
    }
}