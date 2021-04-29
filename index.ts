import { config } from 'dotenv';
import { initialize } from 'express-hibernate-wrapper';
import * as session from 'express-session';
import { updateDatabase } from 'hibernatets';
import passport = require('passport');
import * as auth from './credentials/auth';
const hbs = require('hbs');
import * as cookieParser from 'cookie-parser';
config({
    path: __dirname + '/.env'
});

updateDatabase(__dirname + '/resources/mapserver/models')
    .then(() => {
        initialize(__dirname + '/resources', {
            allowCors: true,
            prereesources: app => {
                app.use(cookieParser());
            },
            public: __dirname + '/public'
        })
            .then(() => {
                console.log('started');

            });
    });
