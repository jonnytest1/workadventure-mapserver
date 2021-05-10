import { column, primary, table } from 'hibernatets';

export const enum InventoryItemType { Random };
@table()
export class InventoryItem {



    @primary()
    id

    @column()
    itemType: InventoryItemType

    constructor(type?: InventoryItemType) {
        if (type !== undefined) {
            this.itemType = type
        }
    }
}