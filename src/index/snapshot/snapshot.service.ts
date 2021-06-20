import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotNamespace } from 'src/common/namespaces';
import { isValidObjectID } from 'src/lib/helpers';
import { ListingDocument } from 'src/schemas/listing.schema';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';

@Injectable()
export class SnapshotService {
    constructor(
        @InjectModel('snapshots')
        private readonly snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getByID(id: string): Promise<SnapshotNamespace.Snapshot | string> {
        if (!isValidObjectID(id)) return 'Invalid snapshot ID';

        return this.snapshotsModel.findOne({ _id: id }).then(async (res) => {
            if (!res) return null;

            const copy = {
                ...res.toJSON(),
            } as any;
            delete copy.__v;

            copy.listings = await this.returnListings(res.listings);

            return copy;
        });
    }

    async getBySKU(
        sku: string
    ): Promise<SnapshotNamespace.SnapshotWithListings> {
        return this.snapshotsModel
            .findOne({ sku })
            .sort('-savedAt')
            .then(async (res) => {
                if (!res) return null;

                const copy = {
                    ...res.toJSON(),
                } as any;
                delete copy.__v;

                copy.listings = await this.returnListings(res.listings);

                return copy;
            });
    }

    private async returnListings(
        ids: string[]
    ): Promise<SnapshotNamespace.Listing[]> {
        // @ts-ignore
        return this.listingsModel.find({ _id: { $in: ids } }).then((res) =>
            res.map((listing) => {
                const obj = Object.assign(
                    {
                        id: listing._id,
                        savedAt: listing.savedAt,
                        lastSeen: listing.lastSeen,
                    },
                    listing.listing
                );

                // @ts-ignore
                delete obj.$init;
                return obj;
            })
        );
    }
}
