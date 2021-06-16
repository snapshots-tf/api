import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerProcessor } from './maker.processor';
import { MakerService } from './maker.service';

import { SnapshotSchema } from '../schemas/snapshot.schema';
import { ListingSchema } from '../schemas/listing.schema';

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
    ],
    providers: [MakerProcessor, MakerService],
})
export class MakerModule {}
