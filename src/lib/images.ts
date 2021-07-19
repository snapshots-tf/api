import { requireStatic, SchemaItem } from 'tf2-static-schema';
import { parseSKU } from 'tf2-item-format';

const items = requireStatic('items') as SchemaItem[];

export interface ItemImages {
    large: string;
    effect?: string;
    small: string;
}

export function toHTTPS(original: string): string {
    return original.replace(
        'http://media.steampowered.com/apps/440/icons/',
        'https://steamcdn-a.akamaihd.net/apps/440/icons/'
    );
}

export function getEffectImage(effect: number): string {
    if (effect === 7) {
        return `/particles/${effect}_380x380.png`;
    }

    return `/particles/${effect}_188x188.png`;
}

export function getImageFromSKU(
    sku: string
): { small: string; large: string; effect: string | null } | null {
    const parsed = parseSKU(sku);

    let found;

    for (let i = 0; i < items.length; i++) {
        if (items[i].defindex === parsed.defindex) {
            found = items[i];
            break;
        }
    }

    if (!found) {
        return null;
    }

    if (parsed.australium) {
        return {
            small: `https://scrap.tf/img/items/440/${found.defindex}-gold.png`,
            large: `https://scrap.tf/img/items/440/${found.defindex}-gold.png`,
            effect: null,
        };
    } else if (parsed.wear) {
        const scrapTFImage = `https://scrap.tf/img/items/warpaint/${encodeURIComponent(
            parsed.defindex
        )}_${parsed.texture}_${parsed.wear}_${
            parsed.festivized === true ? 1 : 0
        }.png`;
        return {
            small: scrapTFImage,
            large: scrapTFImage,
            effect: parsed.effect ? getEffectImage(parsed.effect) : null,
        };
    }

    return {
        small: toHTTPS(found.image_url),
        large: toHTTPS(found.image_url_large),
        effect: parsed.effect ? getEffectImage(parsed.effect) : null,
    };
}
