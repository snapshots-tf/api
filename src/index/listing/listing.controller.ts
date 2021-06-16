import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetListing } from 'src/common/api-responses';
import { ListingService } from './listing.service';

@ApiTags('listing')
@Controller('listing')
export class ListingController {
    constructor(private readonly listingService: ListingService) {}

    @Get('/steamid/:steamid')
    @ApiOperation({
        summary: 'Get latest listing this steamid was found in.',
    })
    @ApiOkResponse({
        type: GetListing,
    })
    async getBySteamID(@Param('steamid') steamid: string): Promise<any> {
        const snapshot = await this.listingService.getOneListing({
            'listing.steamID64': steamid,
        });

        if (!snapshot) {
            return {
                found: false,
            };
        }

        return snapshot;
    }
}
