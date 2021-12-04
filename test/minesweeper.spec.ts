import { MinesweeperResolver } from '../resources/mapserver/service/minesweeper';

describe("minesweeper", () => {
    it("print map", () => {
        const resolver = new MinesweeperResolver();
        console.log(resolver.toString());
    });
});