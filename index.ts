import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { HttpRequest, initialize } from 'express-hibernate-wrapper';
import { load, updateDatabase } from 'hibernatets';
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
                            req.user = await load(User, u => u.cookie = req.cookies.user, undefined, { first: true });
                        } catch (e) {
                            console.error(e);
                        }
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
