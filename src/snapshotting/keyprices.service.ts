import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { promiseDelay } from 'src/lib/helpers';
import * as Currencies from 'tf2-currencies-lite';

export interface IGetCurrenciesResponse {
    response: {
        currencies: {
            keys: {
                name: string;
                price: {
                    value: number;
                };
            };
        };
    };
}

let keyPrice;

@Injectable()
export class KeyPricesService {
    private readonly logger = new Logger(KeyPricesService.name);

    getKeyPrice(): Currencies {
        return keyPrice;
    }

    async check(): Promise<void> {
        try {
            const { data } = (await axios({
                method: 'GET',
                url: 'https://backpack.tf/api/IGetCurrencies/v1',
                params: {
                    key: process.env.BPTF_API_KEY,
                },
                timeout: 10 * 1000,
            })) as { data: IGetCurrenciesResponse };

            keyPrice = new Currencies({
                metal: data.response.currencies.keys.price.value,
                keys: 0,
            });

            this.logger.debug('Got new keyprice!', keyPrice);
        } catch (err) {
            this.logger.warn(
                'Failed to get keyprice, trying again in 10 seconds!'
            );

            return promiseDelay(10 * 1000).then(() => {
                return this.check();
            });
        }
    }
}
