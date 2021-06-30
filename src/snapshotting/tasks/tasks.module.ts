import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
    ],
})
export class TasksModule {}
