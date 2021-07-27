import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiUserSchema } from 'src/lib/schemas/api-user.schema';
import { ApiKeyAuthStrategy } from './auth-api-key.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SteamStrategy } from './auth-steam.strategy';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'api-users', schema: ApiUserSchema },
        ]),
    ],
    providers: [ApiKeyAuthStrategy, AuthService, SteamStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
