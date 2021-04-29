import { GET, HttpRequest, HttpResponse, Path } from 'express-hibernate-wrapper';
import * as passport from 'passport';
import { Strategy } from 'passport-saml';
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new Strategy({
    entryPoint: 'https://sso.brandad-systems.de/adfs/ls/',
    issuer: 'https://your-app.example.net/login/callback',
    callbackUrl: 'https://your-app.example.net/login/callback',
    cert: 'MIICizCCAfQCCQCY8tKaMc0BMjANBgkqh ... W==',
    authnContext: 'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/windows',
    identifierFormat: null
}, (req, profile, doneFnc) => {
    console.log(req, profile, doneFnc);
}));

const authenticationMiddleWare = passport.authenticate('saml', { failureRedirect: '/', failureFlash: true });

@Path('adfs')
export class AdfsTest {

    @GET('/login')
    async login(req: HttpRequest, res: HttpResponse) {
        authenticationMiddleWare(req, res, function next(...args) {
            console.log(...args);
        });

    }
}