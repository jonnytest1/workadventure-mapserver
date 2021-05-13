import { column, primary, table } from 'hibernatets';
import { InventoryItemType } from './inventory-item-type';

@table()
export class InventoryItem {

    @primary()
    id;

    @column()
    itemType: InventoryItemType;

    @column()
    image: string;

    @column()
    inventoryAttributes: string;

    constructor(type?: InventoryItemType) {
        if (type !== undefined) {
            this.itemType = type;
        }
    }

    publicItem() {
        const attributes: { index?: number } = JSON.parse(this.inventoryAttributes);
        return {
            itemType: this.itemType,
            image: this.image,
            id: this.id,
            ...attributes
        };
    }
}