
export const enum InventoryItemType {
    Random
}

export type ImageMap = Record<InventoryItemType, {
    image: string
    title: string
}>;

export const inventoryTypeMap: ImageMap = {
    [InventoryItemType.Random]: {
        image: 'help',
        title: 'a random item that will do something at some point'
    }
};