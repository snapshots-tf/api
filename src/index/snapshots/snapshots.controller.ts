import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSnapshotOverview } from 'src/common/api-responses';
import { SnapshotNamespace } from 'src/common/namespaces';
import { SnapshotsService } from './snapshots.service';

@ApiTags('snapshots')
@Controller('snapshots')
export class SnapshotsController {
    constructor(private snapshotsService: SnapshotsService) {}

    @Get('/sku/:sku')
    @ApiOperation({
        summary:
            'Get x (limited to 10) amount of snapshots (defined by "snapshots" query) in one request. A convenience method.',
    })
    async getSnapshots(
        @Param('sku') sku: string,
        @Query('snapshots', ParseIntPipe) snapshots?: number
    ): Promise<{ sku: string; snapshots: SnapshotNamespace.Listing[] }> {
        return {
            sku,
            snapshots: await this.snapshotsService.getSnapshots(
                sku,
                snapshots < 0 ? snapshots * -1 : snapshots // If its negative then make it positive.
            ),
        };
    }

    @Get('/overview/sku/:sku')
    @ApiOperation({
        summary:
            'Return an overview of snapshots with that SKU. Useful for getting older snapshots. (Limited to 2000)',
    })
    @ApiOkResponse({
        type: GetSnapshotOverview,
    })
    async getSnapshotsOverview(@Param('sku') sku: string): Promise<{
        overview: { id: string; savedAt: number; listingsAmount: number }[];
    }> {
        return {
            overview: await this.snapshotsService.getSnapshotsOverview(sku),
        };
    }
}
