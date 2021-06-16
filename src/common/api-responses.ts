import { ApiProperty } from '@nestjs/swagger';

export class Currency {
    @ApiProperty()
    keys: number;

    @ApiProperty()
    metal: number;
}

export class SnapshotListing {
    @ApiProperty()
    id: string;

    @ApiProperty()
    lastSeen: number;

    @ApiProperty()
    savedAt: number;

    @ApiProperty()
    parts: string[];

    @ApiProperty()
    spells: string[];

    @ApiProperty()
    buying: boolean;

    @ApiProperty()
    listingID: string;

    @ApiProperty()
    paint: string;

    @ApiProperty({
        description:
            'The currencies provided in the listing, they are automatically filled.',
        type: Currency,
    })
    currencies: Currency;

    @ApiProperty()
    bumped: number;

    @ApiProperty()
    created: number;

    @ApiProperty()
    steamid: string;
}

export class ClearQueue {
    @ApiProperty()
    cleared: boolean;
}

export class GetQueueStatus {
    @ApiProperty()
    active: number;

    @ApiProperty()
    waiting: number;
}

export class GetListing {
    @ApiProperty()
    id: string;

    @ApiProperty()
    sku: string;

    @ApiProperty({
        description: 'The actual listing',
        type: SnapshotListing,
    })
    listing: SnapshotListing;

    @ApiProperty()
    savedAt: number;

    @ApiProperty()
    lastSeen: number;
}

export class GetSnapshot {
    @ApiProperty()
    id: string;

    @ApiProperty()
    sku: string;

    @ApiProperty({
        description: 'An array of SnapshotListing(s)',
        type: [SnapshotListing],
    })
    listings: SnapshotListing[];
}

export class GetSnapshotOverview {
    @ApiProperty()
    overview: {
        id: string;

        savedAt: number;

        listings: number;
    };
}

export class GetSnapshotsOverview {
    @ApiProperty()
    items: string[];

    @ApiProperty()
    amount: number;
}
