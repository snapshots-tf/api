import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiUser, ApiUserDocument } from 'src/schemas/api-user.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('api-users')
        private readonly apiUserModel: Model<ApiUserDocument>
    ) {}

    async setAndGetUser(steamID64: string): Promise<ApiUser> {
        const existing = await this.apiUserModel.findOne({ steamID64 }).lean();

        if (!existing) {
            await new this.apiUserModel({
                steamID64,
            }).save();
        }

        return existing || { steamID64 };
    }

    findByApiKey(key: string): Promise<boolean> {
        return this.apiUserModel
            .findOne({ key })
            .lean()
            .then((res) => !!res);
    }
}
