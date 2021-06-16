import { Injectable } from '@nestjs/common';
import { MakerService } from 'src/snapshotting/maker/maker.service';

@Injectable()
export class QueueService {
    constructor(private makerService: MakerService) {}

    async getQueueStatus(): Promise<{ waiting: number; failed: number }> {
        return {
            failed: await this.makerService.getFailedCount(),
            waiting: await this.makerService.getWaitingCount(),
        };
    }

    async clearQueue(): Promise<void> {
        return this.makerService.clear();
    }
}
