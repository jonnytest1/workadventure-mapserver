import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { HttpRequest, initialize } from 'express-hibernate-wrapper';
import { load, save, updateDatabase } from 'hibernatets';
import { v4 as uuid } from 'uuid';
import { User } from './resources/mapserver/models/user';
config({
    path: __dirname + '/.env'
});

updateDatabase(__dirname + '/resources/mapserver/models')
    .then(() => {

        initialize(__dirname + '/resources', {
            allowCors: true,
            prereesources: app => {
                app.use(cookieParser());
                app.use(async (req: any, res, next) => {
                    if (!req.user && req.cookies.user) {
                        try {
                            req.user = await load(User, u => u.cookie = req.cookies.user, undefined, {
                                first: true,
                                deep: {
                                    friends: 'TRUE=TRUE',
                                    friendedUser: {
                                        depths: 6,
                                        filter: 'TRUE=TRUE'
                                    }
                                }
                            });
                        } catch (e) {
                            console.error(e);
                        }
                    } else if (!req.cookies.user) {
                        req.user = new User(uuid());
                        await save(req.user);
                        res.cookie('user', req.user.cookie, {
                            expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 400)),
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none'
                        });
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
