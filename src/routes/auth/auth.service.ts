import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiUser, ApiUserDocument } from 'src/lib/schemas/api-user.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('api-users')
        private readonly apiUserModel: Model<ApiUserDocument>
    ) {}

    async getUser(steamID64: string): Promise<ApiUser> {
        return this.apiUserModel
            .findOne({ steamID64 })
            .then((res) => (!res ? null : res.toJSON()));
    }

    async setUser(steamID64: string): Promise<ApiUser> {
        const existing = await this.apiUserModel.findOne({ steamID64 });

        const { name, avatar } = await this.getSteamUserData(steamID64);

        if (!existing) {
            await new this.apiUserModel({
                steamID64,
                avatar,
                name,
            }).save();
        } else {
            await this.apiUserModel.updateOne(
                {
                    _id: existing._id,
                },
                {
                    avatar,
                    name,
                }
            );
        }

        return existing?.toJSON() || { steamID64, avatar, name };
    }

    findByApiKey(key: string): Promise<boolean> {
        return this.apiUserModel.findOne({ key }).then((res) => {
            console.log(key, res);

            return !!res;
        });
    }

    private getSteamUserData(
        steamID64: string
    ): Promise<{ avatar: string; name: string }> {
        return axios({
            method: 'GET',
            url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
            params: {
                key: process.env.STEAM_API_KEY,
                steamids: steamID64,
            },
        }).then(({ data }) => {
            const user = data.response.players[0];

            return {
                avatar: user.avatarfull,
                name: user.personaname,
            };
        });
    }
}
