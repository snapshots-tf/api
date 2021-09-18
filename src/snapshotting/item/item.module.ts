import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { ItemService } from './item.service';

@Module({
    providers: [ItemService],
    imports: [
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
    ],
})
export class ItemModule {}
