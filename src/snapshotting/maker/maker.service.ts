import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';

@Injectable()
export class MakerService {
    private waitingCache: { time: number; skus: string[] } = {
        time: 0,
        skus: [],
    };

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
            const waiting = await this.getWaiting();

            let hasInQueue = 0;

            for (let i = 0; i < waiting.length; i++) {
                if (waiting[i] === sku) hasInQueue++;
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

    private async getWaiting(): Promise<string[]> {
        const unixTime = Math.floor(new Date().getTime() / 1000);
        if (
            this.waitingCache.time === 0 ||
            unixTime - this.waitingCache.time > 5 * 60
        ) {
            const waiting = (await this.makerQueue.getWaiting()).map(
                (job) => job.data.sku
            );

            this.waitingCache = {
                time: Math.floor(new Date().getTime() / 1000),
                skus: waiting,
            };
        }

        return this.waitingCache.skus;
    }
}
