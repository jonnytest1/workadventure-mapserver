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

    constructor(type?: InventoryItemType) {
        if (type !== undefined) {
            this.itemType = type;
        }
    }
}