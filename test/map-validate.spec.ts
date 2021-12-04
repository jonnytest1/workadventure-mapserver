import { validateMap } from '../resources/mapserver/service/generic-map-factory/generic-map-validator';
import { promises } from "fs";
import { join } from "path";
import { MinesweeperResolver } from '../resources/mapserver/service/minesweeper';
describe("map generator", () => {
    it("validate map", async () => {

        const json = await promises.readFile(join(__dirname, "resources/map.json"), { encoding: "utf8" });

        const valid = validateMap(JSON.parse(json));

        expect(valid).toBe(true);
    });

    it("generates valid minesweeper map", async () => {
        const resolver = new MinesweeperResolver();
        const json = await resolver.buildMap();

        const valid = validateMap(JSON.parse(json));
        expect(valid).toBe(true);
    });
});