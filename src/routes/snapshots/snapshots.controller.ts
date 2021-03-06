import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { GetSnapshotOverview } from 'src/common/api-responses';
import { QuerySnapshotsByIDS } from 'src/common/dtos/GetSnapshotsByIDS.dto';
import QuerySnapshotDTO from 'src/common/dtos/QuerySnapshot.dto';
import { SnapshotNamespace } from 'src/common/namespaces';
import { stringify, parseSKU } from 'tf2-item-format/static';
import { SnapshotsService } from './snapshots.service';

export interface QuerySnapshotsOverview {
    overview: {
        id: string;
        savedAt: number;
        listingsAmount: number;
        sku: string;
    }[];
}

export interface GetSnapshotsOverviewResult {
    sku: string;
    name: string;
    overview: { id: string; savedAt: number; listingsAmount: number }[];
}

@ApiTags('snapshots')
@Controller('snapshots')
export class SnapshotsController {
    constructor(private snapshotsService: SnapshotsService) {}

    @Get('/ids/')
    @ApiOperation({
        summary: 'Get a list of snapshots by ID (limited to 5).',
    })
    @ApiQuery({
        name: 'ids',
        description: 'An array of ids separated by ,',
    })
    public async getSnapshotsByIDS(
        @Query(new ValidationPipe({ transform: true }))
        query: QuerySnapshotsByIDS
    ): Promise<{ snapshots: SnapshotNamespace.SnapshotWithListings[] }> {
        return {
            snapshots: await this.snapshotsService.getSnapshotsByIDS(query.ids),
        };
    }

    @Get('/sku/:sku')
    @ApiOperation({
        summary:
            'Get x (limited to 10) amount of snapshots (defined by "snapshots" query) in one request. A convenience method.',
    })
    public async getSnapshotsBySKU(
        @Param('sku') sku: string,
        @Query('snapshots', ParseIntPipe) snapshots?: number
    ): Promise<{
        sku: string;
        snapshots: SnapshotNamespace.SnapshotWithListings[];
    }> {
        return {
            sku,
            snapshots: await this.snapshotsService.getSnapshots(
                sku,
                snapshots < 0 ? snapshots * -1 : snapshots // If its negative then make it positive.
            ),
        };
    }

    @Get('/overview/query')
    @ApiOperation({
        summary:
            'Return an overview of snapshots with that query. Useful for getting older snapshots. (Limited to 2000)',
    })
    public async querySnapshots(
        @Query(new ValidationPipe({ transform: true })) query: QuerySnapshotDTO
    ): Promise<QuerySnapshotsOverview> {
        const mongoQuery: any = {};

        if (query.craft) {
            mongoQuery.sku = new RegExp(
                `${query.quality ? `.*;${query.quality}` : ''}.*;n${
                    query.craft
                }($|;)`,
                'g'
            );
        } else if (query.quality) {
            mongoQuery.sku = new RegExp(`.*${`;${query.quality}`}.*`, 'g');
        }

        console.log(mongoQuery);

        return {
            overview: (await this.snapshotsService.getSnapshotsOverview(
                '',
                mongoQuery,
                query.oldestFirst === undefined
                    ? '-savedAt'
                    : query.oldestFirst === true
                    ? '+savedAt'
                    : '-savedAt'
            )) as {
                id: string;
                savedAt: number;
                listingsAmount: number;
                sku: string;
            }[],
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
    public async getSnapshotsOverview(
        @Param('sku') sku: string
    ): Promise<GetSnapshotsOverviewResult> {
        return {
            sku,
            name: stringify(parseSKU(sku)),
            overview: await this.snapshotsService.getSnapshotsOverview(sku),
        };
    }
}
