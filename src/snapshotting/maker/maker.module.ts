import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerProcessor } from './maker.processor';
import { MakerService } from './maker.service';

import { SnapshotSchema } from '../../lib/schemas/snapshot.schema';
import { ListingSchema } from '../../lib/schemas/listing.schema';
import { SnapshotsGateway } from 'src/routes/snapshots/snapshots.gateway';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { KeyPricesService } from '../keyprices.service';

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
    providers: [
        MakerProcessor,
        MakerService,
        SnapshotsGateway,
        KeyPricesService,
    ],
})
export class MakerModule {}
