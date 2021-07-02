import { Model, Types } from 'mongoose';
import { SnapshotNamespace } from 'src/common/namespaces';
import { ListingDocument } from 'src/schemas/listing.schema';

export function isValidObjectID(id: string): boolean {
    return Types.ObjectId.isValid(id);
}

export function promiseDelay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export async function returnListings(
    ids: string[],
    model: Model<ListingDocument>
): Promise<SnapshotNamespace.Listing[]> {
    // @ts-ignore
    return model.find({ _id: { $in: ids } }).then((res) => {
        const results = ids.map(function (id) {
            return res.find(function (document) {
                return document._id.equals(id);
            });
        });

        return results.map((listing) => {
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
        });
    });
}
