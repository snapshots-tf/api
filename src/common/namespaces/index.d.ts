export namespace SnapshotNamespace {
    export interface Snapshot {
        sku: string;
        listings: SnapshotListings;
    }

    export interface SnapshotWithListings {
        sku: string;
        listings: Listing[];
    }

    export type SnapshotListings = string[];

    export interface Listing {
        listingID: string;
        steamID64: string;
        paint: string;
        spells: string[];
        parts: string[];
        currencies: {
            metal: number;
            keys: number;
        };
        bumped: number;
        created: number;
        buying: boolean;
    }
}
