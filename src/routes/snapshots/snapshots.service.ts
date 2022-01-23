import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { stringify, parseSKU } from 'tf2-item-format/static';

import { SnapshotDocument } from 'src/lib/schemas/snapshot.schema';
import { SnapshotNamespace } from 'src/common/namespaces/index';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { returnListings } from 'src/lib/helpers';
import { getImageFromSKU, ItemImages } from 'src/lib/images';

export interface OverviewCache {
    time: number;
    item: string[];
}

@Injectable()
export class SnapshotsService {
    private readonly overviewCache: OverviewCache = {
        time: Math.round(new Date().getTime() / 1000),
        item: [],
    };

    constructor(
        @InjectModel('snapshots')
        private readonly snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getSnapshotsCount(): Promise<number> {
        return await this.snapshotsModel.countDocuments({});
    }

    async getOverview(): Promise<string[]> {
        // Check if time is more than 12 hours old and if so, update the cache
        if (
            Math.round(new Date().getTime() / 1000) - this.overviewCache.time >
                43200 ||
            this.overviewCache.item.length === 0
        ) {
            this.overviewCache.time = Math.round(new Date().getTime() / 1000);
            this.overviewCache.item = await this.snapshotsModel.distinct('sku');
        }

        return this.overviewCache.item;
    }

    async getHumanReadableOverview(
        skip: number
    ): Promise<{ image: ItemImages; sku: string; name: string }[]> {
        const overview = (await this.getOverview()).slice(skip, skip + 100);

        return overview.map((value) => {
            return {
                image: getImageFromSKU(value),
                sku: value,
                name: stringify(parseSKU(value)),
            };
        });
    }

    async getSnapshotsByIDS(
        ids: string[]
    ): Promise<SnapshotNamespace.SnapshotWithListings[]> {
        return this.snapshotsModel
            .find({ _id: { $in: ids } })
            .limit(5)
            .then(async (res) => {
                const copies = [];

                for (let i = 0; i < res.length; i++) {
                    const copy = {
                        ...res[i].toJSON(),
                    } as any;
                    delete copy.__v;
                    delete copy.sku;

                    copy.listings = await returnListings(
                        res[i].listings,
                        this.listingsModel
                    );

                    copies.push(copy);
                }

                return copies;
            });
    }

    async getSnapshots(
        sku: string,
        amount: number
    ): Promise<SnapshotNamespace.SnapshotWithListings[]> {
        const res = await this.snapshotsModel
            .find({ sku })
            .sort('-savedAt')
            .limit(amount > 10 ? 10 : amount);

        const copies = [];

        for (let i = 0; i < res.length; i++) {
            const copy = {
                ...res[i].toJSON(),
            } as any;
            delete copy.__v;
            delete copy.sku;

            copy.listings = await returnListings(
                res[i].listings,
                this.listingsModel
            );

            copies.push(copy);
        }

        return copies;
    }

    async getListings(
        sku: string,
        amount: number
    ): Promise<SnapshotNamespace.Listing[]> {
        const res = await this.snapshotsModel
            .find({ sku })
            .sort('-savedAt')
            .limit(amount > 10 ? 10 : amount);

        const copies = [];

        for (let i = 0; i < res.length; i++) {
            copies.push(
                await returnListings(res[i].listings, this.listingsModel)
            );
        }

        return copies;
    }

    async getSnapshotsOverview(
        sku: string,
        query?: any,
        sort?: '-savedAt' | '+savedAt'
    ): Promise<
        { id: string; savedAt: number; listingsAmount: number; sku?: string }[]
    > {
        let mongoQuery = { sku };

        if (query) {
            mongoQuery = query;
        }

        return this.snapshotsModel
            .find(mongoQuery)
            .sort(!sort ? '-savedAt' : sort)
            .lean()
            .limit(4000)
            .then((res) =>
                res.map((res) => {
                    const obj: any = {
                        id: res._id,
                        savedAt: res.savedAt,
                        listingsAmount: res.listings.length,
                    };

                    if (!sort) return obj;

                    obj.sku = res.sku;
                    return obj;
                })
            );
    }
}
