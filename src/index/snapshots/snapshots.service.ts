import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';
import { SnapshotNamespace } from 'src/common/namespaces/index';
import { ListingDocument } from 'src/schemas/listing.schema';

@Injectable()
export class SnapshotsService {
    constructor(
        @InjectModel('snapshots')
        private readonly snapshotsModel: Model<SnapshotDocument>
    ) {}

    async getSnapshotsCount(): Promise<number> {
        return await this.snapshotsModel.countDocuments({});
    }

    async getOverview(): Promise<string[]> {
        return this.snapshotsModel.distinct('sku');
    }

    async getSnapshotsOverview(
        sku: string
    ): Promise<{ id: string; savedAt: number; listingsAmount: number }[]> {
        return this.snapshotsModel
            .find({ sku })
            .sort('-savedAt')
            .lean()
            .limit(500)
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
