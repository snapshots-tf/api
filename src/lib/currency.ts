export interface Currency {
    metal: number;
    keys: number;
}

// BPTF Does not fill currencies for us so we have to do it.
export function fillCurrency(currency: Currency): Currency {
    return {
        metal: currency.metal || 0,
        keys: currency.keys || 0,
    };
}
