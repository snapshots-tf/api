import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerService } from 'src/snapshotting/maker/maker.service';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { SnapshotSchema } from 'src/lib/schemas/snapshot.schema';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';

@Module({
    controllers: [SnapshotController],
    providers: [MakerService, SnapshotService],
    imports: [
        BullModule.registerQueue({
            name: 'maker',
        }),
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class SnapshotModule {}
