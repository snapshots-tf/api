import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = User & mongoose.Document;

@Schema()
export class User {
    @Prop({ required: false })
    id: string;

    @Prop({ required: true, index: true })
    steamID64: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    avatar: string;

    @Prop({ required: true })
    donations: {
        time: number;
        amount: number;
    }[];

    @Prop({ required: true })
    suggestions: {
        time: number;
        created: number;
        nonUnusualAccepted: number;
        unusualAccepted: number;
    }[];

    @Prop({ required: true })
    names: {
        time: number;
        name: string;
    }[];

    @Prop({ required: true })
    trusts: {
        time: number;
        positive: number;
        negative: number;
    }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});
