import { MapJson } from './resources/map';
import { exitTileIndex, MapResolver, startTileIndex } from './woirld-map-resolver';
export class MapContinuationService {
    layerAmount: number;
    indexesInCompleteRow: number;
    completeIndexArraySize: number;
    // startIndex: number;

    mapJson: MapJson;

    startLayersId: number;

    constructor(private zoom = MapResolver.worldZoom, private firstLayerX = 0, private firstLayerY = 0, layermount) {
        this.layerAmount = layermount;// MapResolver.layerSizePerMap//lastLayerX * Math.pow(2, zoom) - (firstLayerX * Math.pow(2, zoom))
        this.indexesInCompleteRow = this.layerAmount * MapResolver.indexesPerTile;
        this.completeIndexArraySize = this.indexesInCompleteRow * this.indexesInCompleteRow;
        //this.startIndex = this.toIndex(this.firstLayerX, this.firstLayerY, 0, 0)
    }

    addContinuationLayersForRow(currentRow: number) {
        const firstInRow = this.indexesInCompleteRow * currentRow;
        const endOfRow = firstInRow + this.indexesInCompleteRow - 1;

        const exitArrayRight = Array(this.completeIndexArraySize)
            .fill(0);
        exitArrayRight.splice(endOfRow, 1, exitTileIndex);

        const startArrayRight = Array(this.completeIndexArraySize)
            .fill(0);
        startArrayRight.splice(endOfRow - 1, 1, startTileIndex);

        const exitArrayLeft = Array(this.completeIndexArraySize)
            .fill(0);
        exitArrayLeft.splice(firstInRow, 1, exitTileIndex);

        const startArrayLeft = Array(2 * this.indexesInCompleteRow)
            .fill(0);
        //const startArrayLeft = [374];
        startArrayLeft.splice(currentRow * 2 + 1, 1, startTileIndex);

        this.mapJson.layers.push({
            data: startArrayLeft,
            name: `start-${currentRow}-left`,
            id: this.startLayersId + 1,
            'opacity': 1,
            'visible': true,
            properties: [
                {
                    'name': 'startLayer',
                    'type': 'bool',
                    'value': true
                }
            ],
            height: currentRow,
            width: 2,
            x: 9,
            y: currentRow + 9,
            type: 'tilelayer'

        });
        this.mapJson.layers.push({
            data: exitArrayLeft,
            name: `exit-${currentRow}-left`,
            id: this.startLayersId + 1,
            'opacity': 1,
            'visible': true,
            properties: [
                {
                    name: 'exitSceneUrl',
                    type: 'string',
                    value: `#start-${currentRow}-right`
                }
            ],
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });
        this.mapJson.layers.push({
            data: exitArrayRight,
            name: `exit-${currentRow}-right`,
            id: this.startLayersId + 1,
            'opacity': 1,
            'visible': true,
            properties: [
                {
                    name: 'exitSceneUrl',
                    type: 'string',
                    value: `#start-${currentRow}-left`
                }
            ],
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });

        this.mapJson.layers.push({
            data: startArrayRight,
            name: `start-${currentRow}-right`,
            id: this.startLayersId + 1,
            'opacity': 1,
            'visible': true,
            properties: [
                {
                    'name': 'startLayer',
                    'type': 'bool',
                    'value': true
                }
            ],
            height: this.indexesInCompleteRow,
            width: this.indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });

    }

}
