import axios from 'axios';
import { toSKU } from 'tf2-item-format/static';
import { SKUAttributes } from 'tf2-item-format';

import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { MakerService } from 'src/maker/maker.service';

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
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private makerService: MakerService) {}

    @Interval(28800 * 1000)
    async handleInterval() {
        this.logger.debug('Get items');

        /*
        const items = await this.getAllItems();

        items.forEach(async (sku) => {
            await this.makerService.enqueue(sku);
        });
        */
    }

    private async getAllItems(): Promise<string[]> {
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

        return skus;
    }
}
