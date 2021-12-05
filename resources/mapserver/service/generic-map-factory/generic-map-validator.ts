import { MapJson } from '../map';


export function validateMap(mapJson: MapJson) {
    const nameMap = {};
    const idMap = {};

    const errors = [];

    let layerLength = null;

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
            if (layerLength == null) {
                layerLength = layer.data.length;
            } else if (layerLength !== layer.data.length) {
                errors.push(`layer with different length ${layer.data.length} compared to ${layerLength}`);
            }
        }

    });

    errors.forEach(console.log);
    if (errors.length == 0) {
        return true;
    }
    return errors;

}