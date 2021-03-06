import { table } from 'hibernatets';
import { ExtendedMapItem } from 'hibernatets/extended-map/extended-map-item';

@table()
export class UserAttribute extends ExtendedMapItem<keyof UserAttributeMap> {

}

export type UserAttributeMap = {
    items: string
    mapSize: number
    previousMap: string
    maxTileSetIndex: number
    shownZoomUpUpdate: boolean
    devicePixelRatio: number
    userAgent: string
};