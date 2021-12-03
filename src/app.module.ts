import * as redisStore from 'cache-manager-redis-store';
import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SnapshotsModule } from './routes/snapshots/snapshots.module';
import { ListingsModule } from './routes/listings/listings.module';

import { MakerModule } from './snapshotting/maker/maker.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './snapshotting/tasks/tasks.module';
import { SnapshotModule } from './routes/snapshot/snapshot.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './routes/auth/auth.module';
import { ListingModule } from './routes/listing/listing.module';
import { AppController } from './app.controller';
import { SnapshotsService } from './routes/snapshots/snapshots.service';
import { ListingSchema } from './lib/schemas/listing.schema';
import { SnapshotSchema } from './lib/schemas/snapshot.schema';
import { MeModule } from './routes/me/me.module';
import { ListingsService } from './routes/listings/listings.service';
import { UsersModule } from './routes/users/users.module';
import { StatsService } from './snapshotting/stats.service';
import { UserSchema } from './lib/schemas/users.schema';
import CustomHttpCacheInterceptor from './common/interceptors/CustomCache';
import { SnapshotsGateway } from './routes/snapshots/snapshots.gateway';
import { KeyPricesService } from './snapshotting/keyprices.service';
import { ItemModule } from './snapshotting/item/item.module';
import { ItemService } from './snapshotting/item/item.service';

@Module({
    imports: [
        SnapshotsModule,
        ListingsModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MakerModule,
        ThrottlerModule.forRoot({
            ttl: 120,
            limit: 60,
        }),
        MongooseModule.forRoot(process.env.MONGODB_STRING, {
            useCreateIndex: true,
        }),
        TasksModule,
        SnapshotModule,
        CacheModule.register({
            store: redisStore,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASS,
            ttl: 15,
            max: 50,
        }),
        AuthModule,
        ListingModule,
        MongooseModule.forFeature([
            { name: 'snapshots', schema: SnapshotSchema },
        ]),
        MongooseModule.forFeature([
            { name: 'listings', schema: ListingSchema },
        ]),
        MongooseModule.forFeature([
            {
                name: 'users',
                schema: UserSchema,
            },
        ]),
        MeModule,
        UsersModule,
        ItemModule,
    ],
    providers: [
        SnapshotsService,
        ListingsService,
        StatsService,
        SnapshotsGateway,
        KeyPricesService,
        {
            provide: APP_INTERCEPTOR,
            useClass: CustomHttpCacheInterceptor,
        },
        ItemService,
        MakerModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
