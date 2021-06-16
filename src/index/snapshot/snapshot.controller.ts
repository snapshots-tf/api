import {
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetSnapshot } from 'src/common/api-responses';
import QuerySnapshotDTO from 'src/common/dtos/QuerySnapshot.dto';
import { MakerService } from 'src/snapshotting/maker/maker.service';
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

        if (!snapshot) throw this.notFound;
        return snapshot;
    }

    @Get('/sku/:sku')
    @ApiOperation({
        summary: 'Get a snapshot.',
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
