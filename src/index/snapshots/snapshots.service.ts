import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';
import { SnapshotNamespace } from 'src/common/namespaces/index';
import { ListingDocument } from 'src/schemas/listing.schema';
import { returnListings } from 'src/lib/helpers';

@Injectable()
export class SnapshotsService {
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
        return this.snapshotsModel.distinct('sku');
    }

    async getSnapshots(
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
        sku: string
    ): Promise<{ id: string; savedAt: number; listingsAmount: number }[]> {
        return this.snapshotsModel
            .find({ sku })
            .sort('-savedAt')
            .lean()
            .limit(2000)
            .then((res) =>
                res.map((res) => {
                    return {
                        id: res._id,
                        savedAt: res.savedAt,
                        listingsAmount: res.listings.length,
                    };
                })
            );
    }
}
