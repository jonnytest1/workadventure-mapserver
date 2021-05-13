import { InventoryItem } from './inventory-item';
import { User } from './user';

export const enum InventoryItemType {
    Random,
    Tile
}

export type ImageMap = Record<InventoryItemType, {
    image: string
    title: string,
    activationText: string,
    activate(item: InventoryItem, user: User): void;
}>;

export const inventoryTypeMap: ImageMap = {
    [InventoryItemType.Random]: {
        image: 'help',
        title: 'a random item that will do something at some point',
        activationText: 'roll for item',
        activate: (item, user) => {
            item.itemType = InventoryItemType.Tile;
            item.inventoryAttributes = JSON.stringify({
                index: Math.floor(Math.random() * user.attributes.getValue('maxTileSetIndex', 668))
            });
        }
    },
    [InventoryItemType.Tile]: {
        image: '{}',
        title: 'a tile',
        activationText: 'place',
        activate: () => {
            //TODO
        }
    }

};