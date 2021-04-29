export interface ILayer {
    data?: Array<number>;
    draworder?: "topdown";
    objects?: Array<unknown>;
    opacity?: number;
    height: number;
    visible?: boolean;
    id: number;
    name: string;
    type: "tilelayer" | 'objectgroup';
    width: number;
    x: number;
    y: number;
    properties?: Array<{
        name: string;
        type: "string" | "bool";
        value: string | boolean;
    }>;
}

export interface MapJson {
    height: number;
    width: number

    layers: Array<ILayer>

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
    }>
}