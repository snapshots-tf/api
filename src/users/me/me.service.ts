import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiUserDocument } from 'src/schemas/api-user.schema';

@Injectable()
export class MeService {
    constructor(
        @InjectModel('api-users')
        private readonly apiUserModel: Model<ApiUserDocument>
    ) {}

    async revokeAPIKey(steamID64: string): Promise<void> {
        return this.apiUserModel
            .updateOne({ steamID64 }, { key: null })
            .then(() => null);
    }

    async getAPIKey(steamID64: string): Promise<string> {
        const user = await this.apiUserModel.findOne({ steamID64 });

        if (!user) throw new Error('Missing user!');

        return user.key;
    }

    async setAPIKey(steamID64: string): Promise<string> {
        const user = await this.apiUserModel.findOne({ steamID64 });

        if (!user) throw new Error('Missing user!');

        if (user.key) return user.key;

        const key = this.generateApiKey();

        await this.apiUserModel.updateOne(
            {
                steamID64,
            },
            {
                key,
            }
        );

        return key;
    }

    private generateApiKey(): string {
        let d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx-xxxxxx-xxxxx-xxxxx-yxyx'.replace(
            /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
            }
        );
    }
}
