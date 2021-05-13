import { column, primary, table } from 'hibernatets';

@table()
export class PrivateMapOverride {
    @primary()
    id: number;

    @column({ type: 'number' })
    index: number;

    @column({ type: 'number' })
    x: number;

    @column({ type: 'number' })
    y: number;
}