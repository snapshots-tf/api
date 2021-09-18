import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { SnapshotsGateway } from 'src/routes/snapshots/snapshots.gateway';
import { ListingSchema } from '../../lib/schemas/listing.schema';
import { SnapshotSchema } from '../../lib/schemas/snapshot.schema';
import { KeyPricesService } from '../keyprices.service';
import { MakerService } from './maker.service';
import { ItemService } from '../item/item.service';

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
    providers: [MakerService, SnapshotsGateway, KeyPricesService, ItemService],
    exports: [MakerService],
})
export class MakerModule {}
