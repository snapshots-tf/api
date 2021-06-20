import { Types } from 'mongoose';
export function isValidObjectID(id: string): boolean {
    return Types.ObjectId.isValid(id);
}
