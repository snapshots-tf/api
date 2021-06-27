import { Model, Types } from 'mongoose';
import { SnapshotNamespace } from 'src/common/namespaces';
import { ListingDocument } from 'src/schemas/listing.schema';
export function isValidObjectID(id: string): boolean {
    return Types.ObjectId.isValid(id);
}

export async function returnListings(
    ids: string[],
    model: Model<ListingDocument>
): Promise<SnapshotNamespace.Listing[]> {
    // @ts-ignore
    return model.find({ _id: { $in: ids } }).then((res) =>
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
