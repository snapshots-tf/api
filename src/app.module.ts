import * as redisStore from 'cache-manager-redis-store';
import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SnapshotsModule } from './index/snapshots/snapshots.module';
import { ListingsModule } from './index/listings/listings.module';

import { BullModule } from '@nestjs/bull';

import { MakerModule } from './maker/maker.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './tasks/tasks.module';
import { QueueModule } from './queue/queue.module';
import { SnapshotModule } from './index/snapshot/snapshot.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ListingModule } from './index/listing/listing.module';
import { AppController } from './app.controller';
import { SnapshotsService } from './index/snapshots/snapshots.service';
import { ListingSchema } from './schemas/listing.schema';
import { SnapshotSchema } from './schemas/snapshot.schema';
import { MakerService } from './maker/maker.service';

@Module({
    imports: [
        SnapshotsModule,
        ListingsModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT),
                password: process.env.REDIS_PASS,
            },
            limiter: {
                max: 1,
                duration: 1000,
            },
        }),
        MakerModule,
        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 60,
        }),
        MongooseModule.forRoot(process.env.MONGODB_STRING, {
            useCreateIndex: true,
        }),
        TasksModule,
        QueueModule,
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
        BullModule.registerQueue({
            name: 'maker',
        }),
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        },
        SnapshotsService,
        MakerService,
    ],
    controllers: [AppController],
})
export class AppModule {}
