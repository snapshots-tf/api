import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSnapshotOverview } from 'src/common/api-responses';
import { MakerService } from 'src/maker/maker.service';
import { SnapshotsService } from './snapshots.service';

@ApiTags('snapshots')
@Controller('snapshots')
export class SnapshotsController {
    constructor(private snapshotsService: SnapshotsService) {}

    @Get('/sku/:sku')
    @ApiOperation({
        summary:
            'Return an overview of snapshots with that SKU. (Limited to 500)',
    })
    @ApiOkResponse({
        type: GetSnapshotOverview,
    })
    async getSnapshots(@Param('sku') sku: string): Promise<{
        overview: { id: string; savedAt: number; listingsAmount: number }[];
    }> {
        return {
            overview: await this.snapshotsService.getSnapshotsOverview(sku),
        };
    }
}
