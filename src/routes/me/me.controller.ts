import {
    Controller,
    Get,
    Inject,
    Post,
    Req,
    Session,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiUser } from 'src/lib/schemas/api-user.schema';
import { RequireAuthGuard } from '../auth/require-auth.guard';
import { MeService } from './me.service';

@Controller('me')
@ApiTags('me')
export class MeController {
    constructor(private readonly meService: MeService) {}

    @Get('/')
    @UseGuards(RequireAuthGuard)
    public getMe(
        @Session() session: Record<string, ApiUser>
    ): ApiUser | { noUser: true } {
        const copy = { ...session.user };

        delete copy.key;
        return copy;
    }

    @Post('/api-key/create')
    @UseGuards(RequireAuthGuard)
    public async createAPIKey(
        @Session() session: Record<string, ApiUser>
    ): Promise<{
        key: string;
    }> {
        return { key: await this.meService.setAPIKey(session.user.steamID64) };
    }

    @Post('/api-key/revoke')
    @UseGuards(RequireAuthGuard)
    public async revokeAPIKey(@Session() session: Record<string, ApiUser>) {
        await this.meService.revokeAPIKey(session.user.steamID64);

        return { revoked: true };
    }

    @Get('/api-key')
    @UseGuards(RequireAuthGuard)
    public async getAPIKey(
        @Session() session: Record<string, ApiUser>
    ): Promise<{ key: string }> {
        return {
            key:
                (await this.meService.getAPIKey(session.user.steamID64)) ||
                null,
        };
    }
}
