import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerService } from 'src/maker/maker.service';
import { ListingSchema } from 'src/schemas/listing.schema';
import { SnapshotSchema } from 'src/schemas/snapshot.schema';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';

@Module({
    controllers: [SnapshotsController],
    providers: [SnapshotsService],
    imports: [
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class SnapshotsModule {}
