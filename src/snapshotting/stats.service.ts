import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { SnapshotDocument } from 'src/lib/schemas/snapshot.schema';
import { UserDocument } from 'src/lib/schemas/users.schema';

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
        cache.stats.listings =
            cache.stats.listings +
            (await this.listingsModel.countDocuments({
                savedAt: { $gte: cache.cached },
            }));
        cache.stats.snapshots =
            cache.stats.snapshots +
            (await this.snapshotsModel.countDocuments({
                savedAt: { $gte: cache.cached },
            }));
        cache.stats.users =
            cache.stats.users +
            (await this.usersModel.countDocuments({
                savedAt: { $gte: cache.cached },
            }));
        cache.cached = Math.round(new Date().getTime() / 1000);
    }
}
