import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from '../../schemas/listing.schema';
import { SnapshotSchema } from 'src/schemas/snapshot.schema';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsGateway } from './snapshots.gateway';

@Module({
    controllers: [SnapshotsController],
    providers: [SnapshotsService, SnapshotsGateway],
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
