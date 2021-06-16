export function isSKU(sku: string): boolean {
    return sku.indexOf(';') !== -1;
}

export function testSKU(sku: string): boolean {
    return /^(\d+);([0-9]|[1][0-5])(;((uncraftable)|(untrad(e)?able)|(australium)|(festive)|(strange)|((u|pk|td-|c|od-|oq-|p)\d+)|(w[1-5])|(kt-[1-3])|(n((100)|[1-9]\d?))))*?$/.test(
        sku
    );
}
