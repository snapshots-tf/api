import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { SnapshotService } from '../snapshot/snapshot.service';
import { SnapshotSchema } from 'src/lib/schemas/snapshot.schema';
import { ListingSchema } from 'src/lib/schemas/listing.schema';

@Module({
    providers: [UsersService, SnapshotService],
    controllers: [UsersController],
    imports: [
        MongooseModule.forFeature([{ name: 'users', schema: UserSchema }]),
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class UsersModule {}
