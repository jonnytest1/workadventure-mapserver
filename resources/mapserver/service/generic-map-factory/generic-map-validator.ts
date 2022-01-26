import { MapJson } from '../map';


export function validateMap(mapJson: MapJson) {
    const nameMap = {};
    const idMap = {};

    const errors = [];

    let layerLength = null;

    const usedIndexes = new Set();

    mapJson.layers.forEach(layer => {

        if (nameMap[layer.name]) {
            errors.push(`duplicate layer name: ${layer.name} this will error`);
        }
        nameMap[layer.name] = layer;

        if (idMap[layer.id]) {
            errors.push(`duplicate layer idMap: ${layer.id} this will error`);
        }
        idMap[layer.id] = layer;

        if (layer.type == "objectgroup") {
            if (layer.objects == undefined) {
                errors.push("phaser assumes objects is defined");
            }
        } else {
            layer.data.forEach(index => {
                usedIndexes.add(index);
            });
            if (layerLength == null) {
                layerLength = layer.data.length;
            } else if (layerLength !== layer.data.length) {
                errors.push(`layer ${layer.name} with different length ${layer.data.length} compared to ${layerLength}`);
            }
        }

    });

    usedIndexes.forEach(usedIndex => {
        if (usedIndex === 0) {
            return;
        }
        for (const tileset of mapJson.tilesets) {
            if (tileset.firstgid <= usedIndex && usedIndex < (tileset.firstgid + tileset.tilecount)) {
                return;
            }
        }
        errors.push(`the index ${usedIndex} does not have a corresponding tileset defining it`);
    });


    errors.forEach(console.log);
    if (errors.length == 0) {
        return true;
    }
    return errors;

}