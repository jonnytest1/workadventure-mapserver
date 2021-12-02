import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { HttpRequest, initialize } from 'express-hibernate-wrapper';
import { load, save, updateDatabase } from 'hibernatets';
import { v4 as uuid } from 'uuid';
import { MessageCommunciation } from './resources/mapserver/message-communication';
import { User } from './resources/mapserver/user/user';
import "./util/fetch";

config({
    path: __dirname + '/.env'
});

updateDatabase(__dirname + '/resources')
    .then(() => {
        initialize(__dirname + '/resources', {
            allowCors: true,
            prereesources: app => {
                app.use(cookieParser());
                app.use(async (req: HttpRequest<User>, res, next) => {
                    if (req.path == "/rest/users") {
                        next()
                        return;
                    }


                    const deepSettings = {
                        first: true as const,
                        deep: {
                            friends: 'TRUE=TRUE',
                            friendedUser: {
                                depths: 4,
                                filter: 'TRUE=TRUE'
                            },
                            attributes: 'TRUE=TRUE',
                            inventory: 'TRUE=TRUE'
                        }
                    }

                    if (req.attributes?.needsUser !== false) {

                        if (!req.user && req.cookies.user) {
                            try {
                                req.user = await load(User, `cookie = ?`, [req.cookies.user], deepSettings);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                        if (!req.user && !req.cookies.user && req.query.pusheruuid) {
                            try {
                                req.user = await load(User, `pusherUuid = ?`, [`${req.query.pusheruuid}`], deepSettings)
                                if (req.user) {
                                    res.cookie('user', req.user.cookie, {
                                        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 400)),
                                        httpOnly: true,
                                        secure: true,
                                        sameSite: 'none'
                                    });
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }
                        if (!req.user && !req.cookies.user) {
                            if (req.method !== 'GET' && req.method !== 'HEAD' || req.path.endsWith('/message.html')) {
                                console.log(`createing new user at ${req.path} with ${req.method}`)
                                req.user = new User(uuid());
                                await save(req.user);
                                res.cookie('user', req.user.cookie, {
                                    expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 400)),
                                    httpOnly: true,
                                    secure: true,
                                    sameSite: 'none'
                                });
                            } else {
                                if (!req.path.endsWith('.png')) {
                                    console.log(`didnt set cookies for ${req.path}`);
                                }
                            }
                        } else {
                            if (req.user && !req.user.referenceUuid) {
                                req.user.referenceUuid = uuid();
                            }
                            if (MessageCommunciation.websockets[req.user.id]) {
                                MessageCommunciation.websockets[req.user.id].user = req.user;
                            }
                        }
                    } else {
                        console.log("doesnt need user")
                    }
                    next();
                });
            },
            public: __dirname + '/public'
        })
            .then(() => {
                console.log('started');

            });
    });
