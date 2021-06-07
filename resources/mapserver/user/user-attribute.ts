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

type MapType<O, T extends Partial<{ [Key in keyof O]: any }>> = { [key in keyof O]: key extends keyof T ? T[key] : unknown };

export type UserAttributeParsed = MapType<UserAttributeMap, {
    mapSize: number
}>;