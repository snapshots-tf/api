import { Schema } from 'mongoose';
export function isValidObjectID(id: string): boolean {
    // @ts-ignore
    if (new Schema.Types.ObjectId(id) !== id) return false;

    return true;
}
