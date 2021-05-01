import base64url from 'base64url';
import { GET, HttpRequest, HttpResponse } from 'express-hibernate-wrapper';

const messageHandlers: { [eventType: string]: (data: any, req: HttpRequest) => any } = {};

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

export class MessageCommunciation {
    @GET('message/:data/message.png')
    async onmessage(req: HttpRequest, res: HttpResponse) {
        const data = JSON.parse(base64url.decode(req.params.data));
        console.log(data);
        const responseJson = await messageHandlers[data.type]({ ...data }, req);
        const jsonStr = JSON.stringify(responseJson);
        res.set('Content-Type', 'text/html')
            .send(`<script>const jsonV=${jsonStr};window.parent.postMessage({data:jsonV,type:"iframeresponse"},"*")</script>`);
    }
}