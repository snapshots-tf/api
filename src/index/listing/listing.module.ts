import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from 'src/schemas/listing.schema';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

@Module({
    controllers: [ListingController],
    providers: [ListingService],
    imports: [
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class ListingModule {}
