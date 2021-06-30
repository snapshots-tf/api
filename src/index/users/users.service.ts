import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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
            else
                throw new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    error: 'We have never seen a listing by that user so we have no record of that user.',
                });
        });
    }

    async getUsers(
        steamIDS: string[]
    ): Promise<{ users: any[]; count: number }> {
        return this.usersModel
            .find({
                steamID64: { $in: steamIDS },
            })
            .then((res) => {
                return {
                    users: res.map((user) => user.toJSON()),
                    count: res.length,
                };
            });
    }
}
