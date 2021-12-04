import { Vector } from '../../models/vector';
import { promises } from "fs";
import { join } from "path";
import { ILayer, MapJson } from '../map';
import { LayerFactory } from './layer-factory/layer-factory';
import { startTileIndex } from '../woirld-map-resolver';
import { validateMap } from './generic-map-validator';
export abstract class MapFactory {

    static readonly startTileIndex = 374 // public/control.png (looks like a 1)


    private nextLayerId: number

    private nextLayerAfterPlayer: number


    protected mapJson: MapJson
    abstract getMapSize(): Vector

    abstract getStartLayerData(): Array<Vector>




    protected async getMapJson(customizer?: ((mapJson) => void)) {
        const buffer = await promises.readFile(join(__dirname, "..", "resources/default-map.json"), { encoding: 'utf8' });

        this.mapJson = JSON.parse(buffer);
        this.nextLayerId = 1;
        this.nextLayerAfterPlayer = 30001;
        this.addLayer(new LayerFactory().floorLayer().build(), true);


        const controlLayerData = new Array(this.getMapSize().lat * this.getMapSize().lon).fill(0);
        const startTileData = this.getStartLayerData().map(vector => vector.toArrayIndex(this.getMapSize().lat));
        startTileData.forEach(index => {
            controlLayerData[index] = startTileIndex;
        });

        this.addLayer(new LayerFactory().withName("controlLayer").withData(controlLayerData).toJson());
        this.mapJson.tilesets[0].tiles.push({
            id: startTileIndex,
            properties: [{
                name: "start",
                type: "bool",
                value: true
            }]
        });


        this.mapJson.width = this.getMapSize().lon;
        this.mapJson.height = this.getMapSize().lat;

        customizer?.(this.mapJson);

        this.mapJson.layers.sort((l1, l2) => l1.id - l2.id);
        if (process.env.DEBUG_MAP) {
            validateMap(this.mapJson);
        }

        return this.mapJson;
    }

    protected addLayer(layerP: ILayer | LayerFactory, abovePlayer = false) {

        let layer: ILayer;
        if (layerP instanceof LayerFactory) {
            if (layerP.data == undefined && layerP.fillNumber) {
                layerP.data = new Array(this.getMapSize().lon * this.getMapSize().lat).fill(layerP.fillNumber);
            }
            layer = layerP.toJson();
        } else {
            layer = layerP;
        }

        if (abovePlayer) {
            layer.id = this.nextLayerAfterPlayer++;
        } else {
            layer.id = this.nextLayerId++;
        }
        if (layer.width === 0) {
            layer.width = this.getMapSize().lon;
        }
        if (layer.height === 0) {
            layer.height = this.getMapSize().lat;
        }
        this.mapJson.layers.push(layer);
    }



}