import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryUserDTO } from 'src/common/dtos/QueryUser.dto';
import { ParseSteamIDPipe } from 'src/pipes/parse-steamid.pipe';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

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
    ): Promise<any> {
        return this.usersService.getUsers(query.steamIDS);
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