import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotNamespace } from 'src/common/namespaces';
import { isValidObjectID, returnListings } from 'src/lib/helpers';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { SnapshotDocument } from 'src/lib/schemas/snapshot.schema';

@Injectable()
export class SnapshotService {
    constructor(
        @InjectModel('snapshots')
        private readonly snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getByID(
        id: string
    ): Promise<SnapshotNamespace.SnapshotWithListings | string> {
        if (!isValidObjectID(id)) return 'Invalid snapshot ID';

        return this.snapshotsModel.findOne({ _id: id }).then(async (res) => {
            if (!res) return null;

            const copy = {
                ...res.toJSON(),
            } as any;
            delete copy.__v;

            copy.listings = await returnListings(
                res.listings,
                this.listingsModel
            );

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

                copy.listings = await returnListings(
                    res.listings,
                    this.listingsModel
                );

                return copy;
            });
    }
}
