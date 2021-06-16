import { Injectable } from '@nestjs/common';
import { MakerService } from 'src/maker/maker.service';

@Injectable()
export class QueueService {
    constructor(private makerService: MakerService) {}

    async getQueueStatus(): Promise<{ active: number; failed: number }> {
        return {
            failed: await this.makerService.getFailedCount(),
            active: await this.makerService.getActiveCount(),
        };
    }

    async clearQueue(): Promise<void> {
        return this.makerService.clear();
    }
}
