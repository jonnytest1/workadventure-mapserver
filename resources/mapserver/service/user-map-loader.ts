import { promises } from 'fs';
import { load, save } from 'hibernatets';
import { User } from '../models/user';
import { UserMapAttributes } from '../models/user-map-attributes';
import { MapJson } from './map';
import { MapAttributes } from './map-attributes-holder';
export class UserMapLoader extends MapAttributes {

    static readonly transparentTileIndex = 6;

    static readonly defaultbackgroundTileIndex = 54;

    constructor() {
        super();
    }

    async getMapJsonForUser(user: User) {
        let [mapAttributes, buffer] = await Promise.all([
            load(UserMapAttributes, a => a.userRef = user.referenceUuid, undefined, { first: true, deep: true }),
            promises.readFile(`${__dirname}/resources/default-map.json`, { encoding: 'utf8' })
        ]);

        if (!mapAttributes) {
            mapAttributes = new UserMapAttributes();
            mapAttributes.userRef = user.referenceUuid;
            save(mapAttributes);
        }

        const mapJson: MapJson = JSON.parse(buffer);

        const mapTilesPerRow = user.attributes.getValue('mapSize', 20);

        const indexesInCompleteRow = mapTilesPerRow;
        const completeIndexArraySize = Math.pow(indexesInCompleteRow, 2);

        mapJson.width = mapJson.height = mapTilesPerRow;

        const startLayerArray = Array(completeIndexArraySize)
            .fill(0);
        startLayerArray[Math.floor(startLayerArray.length / 2)] = MapAttributes.startTileIndex;

        mapJson.layers.push({
            'x': 0,
            'y': 0,
            data: startLayerArray,
            'name': 'start',
            properties: [
                {
                    'name': 'startLayer',
                    'type': 'bool',
                    'value': true
                }
            ],
            'opacity': 1,
            'type': 'tilelayer',
            'visible': true,
            'width': indexesInCompleteRow,
            height: indexesInCompleteRow,
            id: 10000

        });

        mapJson.layers.push({
            draworder: 'topdown',
            objects: [{
                'height': 50,
                'id': 99,
                'name': 'first-start-popup',
                'rotation': 0,
                'type': '',
                'visible': true,
                'width': 100,
                'x': Math.floor(indexesInCompleteRow / 2),
                'y': Math.floor(indexesInCompleteRow / 2)
            }],
            opacity: 1,
            name: 'floorLayer',
            id: 30000,
            height: indexesInCompleteRow,
            width: indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'objectgroup'
        });
        const background = Array(completeIndexArraySize)
            .fill(UserMapLoader.defaultbackgroundTileIndex);

        mapAttributes.privateMapOverrides.forEach(override => {
            const index = override.y * indexesInCompleteRow + override.x;
            background[index] = override.index;
        });

        mapJson.layers.push({
            data: background,
            name: 'background-image',
            id: 20000,
            'opacity': 1,
            'visible': true,
            height: indexesInCompleteRow,
            width: indexesInCompleteRow,
            x: 0,
            y: 0,
            type: 'tilelayer'
        });

        mapJson.layers.sort((l1, l2) => l1.id - l2.id);
        mapJson.layers.forEach((layers, index) => {
            layers.id = index;
        });

        return JSON.stringify(mapJson);
    }

}