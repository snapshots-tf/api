import { Injectable } from '@nestjs/common';
import Bull from 'bull';
import { MakerService } from 'src/snapshotting/maker/maker.service';

@Injectable()
export class QueueService {
    constructor(private makerService: MakerService) {}

    async getQueueStatus(): Promise<Bull.JobCounts> {
        return this.makerService.getCount();
    }

    async clearQueue(): Promise<void> {
        return this.makerService.clear();
    }
}
