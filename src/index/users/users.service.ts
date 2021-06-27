import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/schemas/users.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('users') private readonly usersModel: Model<UserDocument>
    ) {}

    async getUser(steamID64: string): Promise<any> {
        return this.usersModel.findOne({ steamID64 }).then((res) => {
            if (res) return res.toJSON();
            return res;
        });
    }

    async getUsers(steamIDS: string[]): Promise<any> {
        return this.usersModel
            .find({
                steamID64: { $in: steamIDS },
            })
            .then((res) => {
                return res.map((user) => user.toJSON());
            });
    }
}
