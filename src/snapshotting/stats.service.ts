import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { ListingsModule } from 'src/index/listings/listings.module';
import { ListingDocument } from 'src/schemas/listing.schema';
import { SnapshotDocument } from 'src/schemas/snapshot.schema';
import { UserDocument } from 'src/schemas/users.schema';
import * as Currencies from 'tf2-currencies-lite';

interface Statistic {
    listings: number;
    snapshots: number;
    users: number;
}

let cache: { cached: number; stats: Statistic } = {
    cached: 0,
    stats: {
        listings: 0,
        snapshots: 0,
        users: 0,
    },
};

@Injectable()
export class StatsService {
    constructor(
        @InjectModel('snapshots')
        private snapshotsModel: Model<SnapshotDocument>,
        @InjectModel('listings') private listingsModel: Model<ListingDocument>,
        @InjectModel('users') private usersModel: Model<UserDocument>
    ) {}

    getStats(): Statistic {
        this.check().catch(() => null);

        return cache.stats;
    }

    async check(): Promise<void> {
        cache.stats.listings = await this.listingsModel.countDocuments({
            savedAt: { $gte: cache.cached },
        });
        cache.stats.snapshots = await this.snapshotsModel.countDocuments({
            savedAt: { $gte: cache.cached },
        });
        cache.stats.users = await this.usersModel.countDocuments({
            savedAt: { $gte: cache.cached },
        });
        cache.cached = Math.round(new Date().getTime() / 1000);
    }
}
