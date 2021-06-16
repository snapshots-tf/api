import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ListingDocument } from 'src/schemas/listing.schema';

@Injectable()
export class ListingService {
    constructor(
        @InjectModel('listings')
        private readonly listingsModel: Model<ListingDocument>
    ) {}

    async getOneListing(query: {
        sku?: string;
        _id?: string;
        'listing.steamID64'?: string;
    }): Promise<ListingDocument> {
        const res = await this.listingsModel.findOne(query);
        return res;
    }
}
