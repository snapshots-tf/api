import {
    BadRequestException,
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryUserDTO } from 'src/common/dtos/QueryUser.dto';
import { ParseSteamIDPipe } from 'src/pipes/parse-steamid.pipe';
import { SnapshotService } from '../snapshot/snapshot.service';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly snapshotService: SnapshotService
    ) {}

    @Get('/')
    @ApiOperation({
        summary: 'Get a list of users.',
    })
    @ApiQuery({
        name: 'steamIDS',
        description: 'An array of steamids seperated by ,',
    })
    public async getUsers(
        @Query(new ValidationPipe({ transform: true })) query: QueryUserDTO
    ): Promise<{ users: any[]; count: number }> {
        return this.usersService.getUsers(query.steamIDS);
    }

    @Get('/snapshot/:id')
    @ApiOperation({
        summary:
            'Get a list of users that are in a snapshot, convenience method.',
    })
    async getById(@Param('id') id: string): Promise<any> {
        const snapshot = await this.snapshotService.getByID(id);

        if (typeof snapshot === 'string') {
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Incorrect ID specified.',
            });
        } else if (!snapshot) {
            throw new NotFoundException({
                status: HttpStatus.NOT_FOUND,
                error: 'A snapshot with your specified properties could not be found, it may not exist.',
            });
        }

        return this.usersService.getUsers(
            snapshot.listings.map((listing) => listing.steamID64)
        );
    }

    @Get('/:steamID')
    @ApiOperation({
        summary: 'Get one user',
    })
    public async getUser(
        @Param('steamID', new ParseSteamIDPipe()) steamID: string
    ): Promise<any> {
        return this.usersService.getUser(steamID);
    }
}
