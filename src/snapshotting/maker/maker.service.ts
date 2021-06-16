import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, Queue } from 'bull';
import { Model } from 'mongoose';
import { ListingDocument } from 'src/schemas/listing.schema';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';

@Injectable()
export class MakerService {
    constructor(
        @InjectQueue('maker')
        private readonly makerQueue: Queue<{ sku: string }>
    ) {}

    async getFailedCount(): Promise<number> {
        return this.makerQueue.getFailedCount();
    }

    async getWaitingCount(): Promise<number> {
        return await this.makerQueue.getWaitingCount();
    }

    async getQueue(): Promise<Job<{ sku: string }>[]> {
        return this.makerQueue.getJobs([]);
    }

    async getIndex(sku: string): Promise<number> {
        const active = await this.getQueue();

        for (let i = 0; i < active.length; i++) {
            if (active[i].data.sku === sku) return i;
        }

        return null;
    }

    async clear(): Promise<void> {
        return this.makerQueue.empty();
    }

    async enqueue(sku: string, skipHasCheck: boolean = false): Promise<number> {
        if (!skipHasCheck) {
            const waiting = await this.makerQueue.getWaiting();

            let hasInQueue = 0;

            for (let i = 0; i < waiting.length; i++) {
                if (waiting[i].data.sku === sku) hasInQueue++;
            }

            if (hasInQueue >= 3) throw new Error('Too many in the queue!');
        }

        return this.makerQueue
            .add(
                'snapshot',
                {
                    sku: sku,
                },
                {
                    removeOnComplete: true,
                }
            )
            .then(async () => {
                return (
                    Math.round(new Date().getTime() / 1000) +
                    (await this.getWaitingCount()) * 1000 +
                    10 * 1000
                );
            });
    }
}
