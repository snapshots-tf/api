import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { SnapshotNamespace } from '../common/namespaces/index';

export type SnapshotDocument = Snapshot & mongoose.Document;

@Schema()
export class Snapshot {
    @Prop({ required: false })
    id: string;

    @Prop({ required: true, index: true })
    sku: string;

    @Prop({ required: true })
    savedAt: number;

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    listings: SnapshotNamespace.SnapshotListings;
}

export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);

SnapshotSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});
