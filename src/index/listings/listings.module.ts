import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from 'src/schemas/listing.schema';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
    controllers: [ListingsController],
    providers: [ListingsService],
    imports: [
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class ListingsModule {}
