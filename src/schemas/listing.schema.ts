import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { SnapshotNamespace } from '../common/namespaces/index';

export type ListingDocument = Listing & mongoose.Document;

@Schema()
export class Listing {
    @Prop({ required: false })
    id: string;

    @Prop({ required: true })
    sku: string;

    @Prop({ required: true })
    savedAt: number;

    @Prop({ required: true })
    lastSeen: number;

    @Prop(
        raw({
            listingID: {
                type: String,
                index: true,
            },
            steamID64: {
                type: String,
                index: true,
            },
            paint: {
                type: String,
                required: false,
                index: true,
            },
            parts: {
                type: Array,
            },
            spells: {
                type: Array,
                index: true,
            },
            currencies: {
                type: Object,
            },
            bumped: {
                type: Number,
            },
            created: {
                type: Number,
            },
            buying: {
                type: Boolean,
            },
            automatic: {
                type: Boolean,
            },
        })
    )
    listing: SnapshotNamespace.Listing;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

ListingSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});
