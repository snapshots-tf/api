import {
    BadRequestException,
    Controller,
    Get,
    HttpStatus,
    Param,
    Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetListing } from 'src/common/api-responses';
import { ListingService } from './listing.service';

@ApiTags('listing')
@Controller('listing')
export class ListingController {
    constructor(private readonly listingService: ListingService) {}

    @Get('/id/:id')
    @ApiOperation({
        summary: 'Get a listing by ID.',
    })
    async getByID(@Param('id') id: string): Promise<any> {
        const listing = await this.listingService.getOneListing({ _id: id });

        if (typeof listing === 'string') {
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Incorrect ID specified.',
            });
        }

        return (
            listing || {
                found: false,
            }
        );
    }
}
