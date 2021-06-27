import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerProcessor } from './maker.processor';
import { MakerService } from './maker.service';

import { SnapshotSchema } from '../../schemas/snapshot.schema';
import { ListingSchema } from '../../schemas/listing.schema';
import { SnapshotsGateway } from 'src/index/snapshots/snapshots.gateway';
import { UserSchema } from 'src/schemas/users.schema';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'maker',
        }),
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: 'listings',
                schema: ListingSchema,
            },
        ]),
        MongooseModule.forFeature([
            {
                name: 'users',
                schema: UserSchema,
            },
        ]),
    ],
    providers: [MakerProcessor, MakerService, SnapshotsGateway],
})
export class MakerModule {}
