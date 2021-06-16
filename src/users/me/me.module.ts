import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiUserSchema } from 'src/schemas/api-user.schema';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
    controllers: [MeController],
    providers: [MeService],
    imports: [
        MongooseModule.forFeature([
            { name: 'api-users', schema: ApiUserSchema },
        ]),
    ],
})
export class MeModule {}
