import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { MakerService } from 'src/snapshotting/maker/maker.service';
import { KeyPricesService } from '../keyprices.service';
import { TasksService } from './tasks.service';

@Module({
    providers: [TasksService, MakerService, KeyPricesService],
    imports: [
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
            name: 'maker',
        }),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class TasksModule {}
