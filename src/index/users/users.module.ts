import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schemas/users.schema';

@Module({
    providers: [UsersService],
    controllers: [UsersController],
    imports: [
        MongooseModule.forFeature([{ name: 'users', schema: UserSchema }]),
    ],
})
export class UsersModule {}
