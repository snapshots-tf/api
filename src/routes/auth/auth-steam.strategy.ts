import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-steam';
import { AuthService } from './auth.service';
import { ApiUser } from '../../lib/schemas/api-user.schema';

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            returnURL: process.env.STEAM_RETURN_URL,
            realm: process.env.STEAM_REALM,
            profile: false,
        });
    }

    async validate(identifier: string): Promise<ApiUser> {
        const steamID64 = identifier.substr(37);

        const user = await this.authService.setUser(steamID64);

        return user;
    }
}
