import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnapshotNamespace } from 'src/common/namespaces';
import { ListingDocument } from 'src/schemas/listing.schema';

@Injectable()
export class ListingsService {
    constructor(
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getBySteamID(steamid: string): Promise<ListingDocument[]> {
        return this.listingsModel
            .find({ 'listing.steamID64': steamid })
            .sort('-lastSeen')
            .limit(100);
    }
}
