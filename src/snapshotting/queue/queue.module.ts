import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { BullModule } from '@nestjs/bull';
import { MakerService } from 'src/snapshotting/maker/maker.service';

@Module({
    providers: [QueueService, MakerService],
    controllers: [QueueController],
    imports: [
        BullModule.registerQueue({
            name: 'maker',
        }),
    ],
})
export class QueueModule {}
