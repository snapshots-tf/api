import { Controller, Get, Post, Req, Session, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiUser } from 'src/schemas/api-user.schema';
import { RequireAuthGuard } from '../auth/require-auth.guard';
import { MeService } from './me.service';

@Controller('me')
@ApiTags('me')
export class MeController {
    constructor(private readonly meService: MeService) {}

    @Get('/')
    @UseGuards(RequireAuthGuard)
    getMe(
        @Session() session: Record<string, { steamID64: string }>
    ): ApiUser | { noUser: true } {
        return session.user;
    }

    @Get('/api-key')
    @UseGuards(RequireAuthGuard)
    getMyApiKeyGET(
        @Session() session: Record<string, { steamID64: string }>
    ): any {
        return this.meService.getOrSetApiKey(session.user.steamID64);
    }
}
