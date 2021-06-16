import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ApiUserDocument = ApiUser & mongoose.Document;

@Schema()
export class ApiUser {
    @Prop({ required: true })
    steamID64: string;

    @Prop({ required: false })
    key?: string;
}

export const ApiUserSchema = SchemaFactory.createForClass(ApiUser);

ApiUserSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});
