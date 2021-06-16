import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MakerService } from 'src/maker/maker.service';
import { TasksService } from './tasks.service';

@Module({
    providers: [TasksService, MakerService],
    imports: [
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
            name: 'maker',
        }),
    ],
})
export class TasksModule {}
