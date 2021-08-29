import { Currency } from '../api-responses';

export interface BPTFSnapshotListing {
    steamid: string;
    offers: 1 | 0;
    buyout: 1 | 0;
    details: string;
    intent: 'sell' | 'buy';
    timestamp: number;
    bump: number;
    price: number;
    item: {
        id: string;
        original_id: string;
        defindex: number;
        attributes: Attributes[];
    };
    currencies: Currency;
    userAgent?: {
        client: string;
        lastPulse: number;
    };
}

export interface SearchListingResponse {
    buy: {
        total: number;
        listings: BuyListing[];
    };
    sell: {
        total: number;
        listings: SellListing[];
    };
}

export type BuyListing = Listing & {
    item: BuyOrderItem;
    intent: 0;
};

export type SellListing = Listing & {
    item: SellOrderItem;
    intent: 1;
};

export type Listing = {
    id: string;
    steamid: string;
    appid: number;
    currencies: {
        metal: number;
        keys: number;
    };
    offers: number;
    buyout: number;
    details: string;
    created: number;
    bump: number;
    intent: 1 | 0;
    automatic: number;
    count: number;
    promoted: number;
};

export type OrderItem = {
    defindex: number;
    quality: number;
    attributes: Attributes[];
    name: string;
    quantity: string;
};

export type SellOrderItem = OrderItem & {
    id: number;
    original_id: number;
    level: number;
    inventory: number;
    origin: number;
    style: number;
};

export type BuyOrderItem = OrderItem & {
    'user-id': string;
};

export type Attributes = {
    float_value?: number;
    defindex: number;
    value?: number | string;
};
