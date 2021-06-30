import {
    BadRequestException,
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetSnapshot } from 'src/common/api-responses';
import { SnapshotService } from './snapshot.service';

@ApiTags('snapshot')
@Controller('snapshot')
export class SnapshotController {
    private readonly notFound = new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'A snapshot with your specified properties could not be found, it may not exist.',
    });

    constructor(private snapshotService: SnapshotService) {}

    @Get('/id/:id')
    @ApiOperation({
        summary: 'Get a snapshot by id.',
    })
    @ApiResponse({
        status: 404,
        description: 'Snapshot not found.',
    })
    @ApiOkResponse({
        type: GetSnapshot,
    })
    async getById(@Param('id') id: string): Promise<any> {
        const snapshot = await this.snapshotService.getByID(id);

        if (typeof snapshot === 'string') {
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Incorrect ID specified.',
            });
        }

        if (!snapshot) throw this.notFound;
        return snapshot;
    }

    @Get('/sku/:sku')
    @ApiOperation({
        summary:
            'Get a snapshot by SKU! You will only get the latest one we have if you want a specific snapshot then please use the /snapshots/overview/sku endpoint first and then search by ID.',
    })
    @ApiResponse({
        status: 404,
        description: 'Snapshot not found.',
    })
    @ApiOkResponse({
        type: GetSnapshot,
    })
    async getBySKU(@Param('sku') sku: string): Promise<any> {
        const snapshot = await this.snapshotService.getBySKU(sku);

        if (!snapshot) throw this.notFound;

        return snapshot;
    }
}
