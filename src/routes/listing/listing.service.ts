import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ListingDocument } from 'src/lib/schemas/listing.schema';
import { isValidObjectID } from 'src/lib/helpers';

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
    }): Promise<ListingDocument | string> {
        if (query._id && !isValidObjectID(query._id))
            return 'Invalid listing ID';

        const res = await this.listingsModel.findOne(query);
        return res;
    }
}
