import { PrivateMapOverride } from '../private-map-override';
import { User } from '../user';
import { userAttributesForUserRefUuid } from '../user-map-attributes-loader';
import { InventoryItem } from './inventory-item';
import { InventoryItemType } from './inventory-item-type';
import { RemoveItem } from './remove-item-error';
export type ItemActivationData = {
    item: number;
    position?: {
        x: number;
        y: number;
    };
};
export type ItemActivation = Record<InventoryItemType, {

    activate(item: InventoryItem, user: User, data: ItemActivationData): Promise<void>;
}>;

export const inventoryActivationMap: ItemActivation = {
    [InventoryItemType.Random]: {
        activate: async (item, user) => {
            item.itemType = InventoryItemType.Tile;
            item.inventoryAttributes = JSON.stringify({
                index: Math.floor(Math.random() * user.attributes.getValue('maxTileSetIndex', 668))
            });
        }
    },

    [InventoryItemType.Tile]: {
        activate: async (item, user, data) => {
            const mapAttributes = await userAttributesForUserRefUuid(user.referenceUuid);
            const mapOverride = new PrivateMapOverride();
            mapOverride.x = data.position.x;
            mapOverride.y = data.position.y;
            mapOverride.index = JSON.parse(item.inventoryAttributes).index;

            mapAttributes.privateMapOverrides.push(mapOverride);
            throw new RemoveItem();
        }
    }
};