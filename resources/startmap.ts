import { GET, HttpResponse, Path, ResponseCodeError } from 'express-hibernate-wrapper';
import { promises } from 'fs';
import { join } from 'path';


@Path('start/:uuid')
export class StartMap {

    @GET({ path: ":resource", attributes: { needsUser: false } })
    @GET({ path: ":resource/:p1", attributes: { needsUser: false } })
    @GET({ path: ":resource/:p1/:p2", attributes: { needsUser: false } })
    async getResource(req, res: HttpResponse) {

        const path = req.params.resource;
        const p1 = req.params.p1
        const p2 = req.params.p2
        if ([path, p1, p2].some(p => p && p.includes('..')) || [path, p1, p2].some(p => p && p.includes('/'))) {
            throw new ResponseCodeError(403, '');
        }
        const pathParts = [__dirname, `../public/`, path]
        if (p1) {
            pathParts.push(p1)
        }
        if (p2) {
            pathParts.push(p2)
        }
        try {
            const resource = join(...pathParts);

            const buffer = await promises.readFile(resource);

            const contentType = this.getContentType(path)

            res.set('Content-Type', contentType)
                .send(buffer);
        } catch (e) {
            throw e;
        }
    }
    getContentType(path: string) {
        if (path.endsWith(".png")) {
            return 'image/png'
        } else if (path.endsWith(".js")) {
            return "application/javascript"
        } else if (path.endsWith(".json")) {
            return "application/json"
        }
    }
}