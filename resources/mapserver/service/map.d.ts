
export type ILayerType = "tilelayer" | 'objectgroup'
export interface ILayer<T extends ILayerType = ILayerType> {
    data?: Array<number>;
    draworder?: "topdown";
    objects?: T extends "objectgroup" ? Array<unknown> : never;
    opacity?: number;
    height: number;
    visible?: boolean;
    id: number;
    name: string;
    type: T;
    width: number;
    x: number;
    y: number;
    properties?: Array<Property>;
}

interface Property {
    name: string,
    type: "string" | "bool",
    value: string | boolean
}

export interface MapJson {
    height: number;
    width: number

    layers: Array<ILayer>

    properties: Array<Property>

    tilesets: Array<{
        columns: number;
        firstgid: number;
        image: string;
        imageheight: number;
        imagewidth: number;
        margin: number;
        name: string;
        spacing: number;
        tilecount: number;
        tileheight: number;
        tilewidth: number;
        transparentcolor: string;

        tiles?: Array<{
            id: number,
            properties?: Array<Property>
        }>
    }>
}