import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { SnapshotSchema } from 'src/lib/schemas/snapshot.schema';
import { UserSchema } from 'src/lib/schemas/users.schema';
import { SnapshotsGateway } from 'src/routes/snapshots/snapshots.gateway';
import { MakerService } from 'src/snapshotting/maker/maker.service';
import { KeyPricesService } from '../keyprices.service';
import { MakerModule } from '../maker/maker.module';
import { TasksService } from './tasks.service';

@Module({
    providers: [TasksService, MakerService, KeyPricesService, SnapshotsGateway],
    imports: [
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: 'users',
                schema: UserSchema,
            },
        ]),
        MakerModule,
    ],
})
export class TasksModule {}
