import { column, primary, table } from 'hibernatets';

@table()
export class MapCache {

    @primary()
    id: number;

    @column({ type: 'number' })
    layerStartLat;

    @column({ type: 'number' })
    layerStartLon;

    @column({ type: 'number' })
    zoom: number;

    @column({ size: 'large' })
    mapJson: string;

}