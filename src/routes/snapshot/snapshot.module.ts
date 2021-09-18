import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { SnapshotSchema } from 'src/lib/schemas/snapshot.schema';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { ItemService } from 'src/snapshotting/item/item.service';
import { KeyPricesService } from 'src/snapshotting/keyprices.service';
import { MakerService } from 'src/snapshotting/maker/maker.service';
import { SnapshotsGateway } from '../snapshots/snapshots.gateway';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';

@Module({
    controllers: [SnapshotController],
    providers: [
        MakerService,
        SnapshotService,
        SnapshotsGateway,
        KeyPricesService,
        ItemService,
    ],
    imports: [
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: 'users',
                schema: UserSchema,
            },
        ]),
    ],
})
export class SnapshotModule {}
