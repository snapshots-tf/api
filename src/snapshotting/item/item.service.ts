import axios from 'axios';
import { toSKU } from 'tf2-item-format/static';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { SKUAttributes } from 'tf2-item-format';

interface IGetPricesPrice {
    value: number;
    currency: 'keys' | 'metal';
    australium?: boolean;
}

interface IGetPricesItem {
    defindex: number[];
    prices: {
        [quality: number]: {
            Tradable?: {
                Craftable?:
                    | IGetPricesItem[]
                    | { [effect: number]: IGetPricesPrice };
                'Non-Craftable'?:
                    | IGetPricesItem[]
                    | { [effect: number]: IGetPricesPrice };
            };
        };
    };
}

@Injectable()
export class ItemService {
    constructor(
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getAllItems(): Promise<string[]> {
        const response = (await axios({
            method: 'GET',
            url: 'https://backpack.tf/api/IGetPrices/v4',
            params: {
                raw: 0,
                key: process.env.BPTF_API_KEY,
            },
        })) as {
            data: { response: { items: { [name: string]: IGetPricesItem } } };
        };

        const distinct = await this.listingsModel.distinct('sku');

        const items = response.data.response.items;

        const skus = [];

        for (const name in items) {
            const item = items[name];
            for (const quality in item.prices) {
                const parseItem = (
                    pricesItem:
                        | IGetPricesItem[]
                        | { [effect: number]: IGetPricesPrice },
                    craftable: boolean
                ) => {
                    const itemTemplate: SKUAttributes = {
                        quality: parseInt(quality),
                        defindex: item.defindex[0],
                        craftable,
                    };
                    if (typeof pricesItem === 'object') {
                        for (const effect in pricesItem) {
                            const itemTemplateCopy = { ...itemTemplate };
                            itemTemplateCopy.effect = parseInt(effect);

                            skus.push(toSKU(itemTemplateCopy));
                        }
                    } else {
                        const item = pricesItem[0] as IGetPricesPrice;
                        if (item.australium)
                            itemTemplate.australium = item.australium;

                        skus.push(toSKU(itemTemplate));
                    }
                };

                const craftableItem = item.prices[quality].Tradable.Craftable;
                const unCraftableItem =
                    item.prices[quality].Tradable['Non-Craftable'];

                if (craftableItem) parseItem(craftableItem, true);
                if (unCraftableItem) parseItem(unCraftableItem, false);
            }
        }

        for (let i = 0; i < distinct.length; i++) {
            if (!skus.includes(distinct[i])) skus.push(distinct[i]);
        }

        return skus;
    }
}
