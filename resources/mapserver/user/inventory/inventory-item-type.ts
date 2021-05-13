
export const enum InventoryItemType {
    Random,
    Tile
}

export type ImageMap = Record<InventoryItemType, {
    image: string
    title: string,
    activationText: string,
}>;

export const inventoryTypeMap: ImageMap = {
    [InventoryItemType.Random]: {
        image: 'help',
        title: 'a random item that will do something at some point',
        activationText: 'roll for item',

    },
    [InventoryItemType.Tile]: {
        image: '{}',
        title: 'a tile',
        activationText: 'place at player',

    }

};