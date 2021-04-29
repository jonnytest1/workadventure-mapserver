import { column, primary, table } from 'hibernatets';

@table()
export class Tile {

    @primary()
    id: number;

    @column()
    x;

    @column()
    y;

    @column()
    zoom;

    @column({
        size: 'large',
        transformations: {
            loadFromDbToProperty: async str => new Int8Array(JSON.parse(str)).buffer,
            saveFromPropertyToDb: async buffer => JSON.stringify([...new Int8Array(buffer)])
        }
    })
    data: ArrayBuffer;

}