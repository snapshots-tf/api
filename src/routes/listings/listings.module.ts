import { CacheInterceptor, forwardRef, Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppModule } from 'src/app.module';
import { ListingSchema } from 'src/lib/schemas/listing.schema';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
    controllers: [ListingsController],
    providers: [ListingsService],
    imports: [
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
        forwardRef(() => AppModule),
    ],
})
export class ListingsModule {}
