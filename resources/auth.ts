import { GET, Path } from 'express-hibernate-wrapper';

@Path('')
export class AuthenticationResources {

    private static users: { [username: string]: any } = {};

    @GET({ path: '' })
    async index(req, res) {
        // Check session
        if (req.session.username) {
            // If user is signed in, redirect to `/reauth`.
            res.redirect(307, '/nodetype/rest/reauth');
            return;
        }
        // If user is not signed in, show `index.html` with id/password form.
        res.render('index.html');
    }

    @GET({ path: 'reauth' })
    async reauth(req, res) {
        const username = req.session.username;

        console.log('reauth:' + username);
        if (!username) {
            res.redirect(302, '/nodetype/rest');
            return;
        }

        // Show `reauth.html`.
        // User is supposed to enter a password (which will be ignored)
        // Make XHR POST to `/signin`
        res.render('reauth.html', { username: username });
    }

    @GET({ path: '/home' })
    async home(req, res) {
        if (!req.session.username || req.session['signed-in'] !== 'yes') {
            // If user is not signed in, redirect to `/`.
            res.redirect(307, '/');
            return;
        }
        // `home.html` shows sign-out link
        res.render('home.html', { username: req.session.username });
    }

    @GET({ path: '.well-known/assetlinks.json' })
    async asetlinks(req, res) {
        console.error('assetlinks');
    }
}