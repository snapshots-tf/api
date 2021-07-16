import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseSteamIDPipe } from 'src/pipes/parse-steamid.pipe';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) {}

    @Get('/steamid/:steamid')
    @ApiOperation({
        summary: 'Get latest 100 listings from this user.',
    })
    async getBySKU(
        @Param('steamID', new ParseSteamIDPipe()) steamID: string
    ): Promise<any> {
        return this.listingsService.getBySteamID(steamID);
    }
}
