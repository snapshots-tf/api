import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakerService } from './maker.service';

import { SnapshotSchema } from '../../lib/schemas/snapshot.schema';
import { ListingSchema } from '../../lib/schemas/listing.schema';
import { SnapshotsGateway } from 'src/routes/snapshots/snapshots.gateway';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { KeyPricesService } from '../keyprices.service';
import { TasksService } from '../tasks/tasks.service';

@Module({
    imports: [
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
    providers: [MakerService, SnapshotsGateway, KeyPricesService],
    exports: [MakerService],
})
export class MakerModule {}
