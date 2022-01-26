import { MappingWorldMapResovler } from '../resources/mapserver/service/mapping-world-map-resolver';

import { config } from "dotenv";
import { join } from "path";
import { validateMap } from '../resources/mapserver/service/generic-map-factory/generic-map-validator';
config({
    path: join(__dirname, "..", ".env")
});
describe("mapreplace", () => {
    it("analyzes map", async () => {
        jest.setTimeout(99999);
        const resolver = await new MappingWorldMapResovler().getWorldMapJson();
        const valid = validateMap(JSON.parse(resolver));
        expect(valid).toBe(true);
        expect(resolver).toBeDefined();
    });
});

