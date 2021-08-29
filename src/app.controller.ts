import {
    BadRequestException,
    CacheTTL,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiExcludeEndpoint,
    ApiHeader,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { parseSKU, stringify } from 'tf2-item-format/static';
import { GetSnapshotsOverview, GetStats } from './common/api-responses';
import { getImageFromSKU, ItemImages } from './lib/images';
import { testSKU } from './lib/skus';
import { ListingsService } from './routes/listings/listings.service';
import { SnapshotsService } from './routes/snapshots/snapshots.service';
import { MakerService } from './snapshotting/maker/maker.service';
import { StatsService } from './snapshotting/stats.service';

@ApiTags('index')
@Controller('')
export class AppController {
    constructor(
        private snapshotsService: SnapshotsService,
        private listingsService: ListingsService,
        private makerService: MakerService,
        private statsService: StatsService
    ) {}

    @Get('/item-info/:sku')
    @ApiExcludeEndpoint()
    getItemInfo(@Param('sku') sku: string): {
        name: string;
        image: { effect: string; large: string; small: string };
        sku: string;
    } {
        if (!testSKU(sku) || sku.indexOf(';') === -1) return;

        return {
            name: stringify(parseSKU(sku)),
            image: getImageFromSKU(sku),
            sku,
        };
    }

    @Get('/search/:query')
    @ApiExcludeEndpoint()
    async search(
        @Param('query') query: string
    ): Promise<{ results: { sku: string; name: string }[] }> {
        query = query.trim();

        if (query.indexOf(';') !== -1) {
            const test = testSKU(query);

            if (!test) {
                throw new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    error: 'Not a correct SKU!',
                });
            } else {
                return {
                    results: [
                        {
                            sku: query,
                            name: stringify(parseSKU(query)),
                        },
                    ],
                };
            }
        }

        const skus = await this.snapshotsService.getOverview();

        let matches: { sku: string; name: string; image: ItemImages }[] = [];

        for (let i = 0; i < skus.length; i++) {
            let skuName;

            try {
                skuName = stringify(parseSKU(skus[i]));
            } catch (err) {
                console.log('Failed to stringify sku: ' + skus[i]);
                continue;
            }

            if (
                skuName.toLowerCase().indexOf(query.toLowerCase()) !== -1 &&
                matches.length < 10
            )
                matches.push({
                    name: skuName,
                    sku: skus[i],
                    image: getImageFromSKU(skus[i]),
                });
            else if (skuName.toLowerCase() === query.toLowerCase()) {
                matches.push({
                    name: skuName,
                    sku: skus[i],
                    image: getImageFromSKU(skus[i]),
                });
                break;
            }
        }

        return { results: matches };
    }

    @Get('/stats')
    @ApiOperation({
        summary: 'Get API statistics. Cached for 30 seconds.',
    })
    @ApiOkResponse({
        type: GetStats,
    })
    @CacheTTL(30)
    stats(): { listings: number; users: number; snapshots: number } {
        return this.statsService.getStats();
    }

    @Post('/request/:sku')
    @ApiOperation({
        summary: 'Request a sku to be snapshotted.',
    })
    @UseGuards(AuthGuard('api-key'))
    @ApiHeader({
        name: 'X-SNAPSHOT-KEY',
        description:
            "This key is required for this endpoint to work, get it by first going to /auth/steam then /me/api-key. It's bound to the account you sign in with.",
    })
    async request(
        @Param('sku') sku: string
    ): Promise<{ enqueued: boolean; expected: number }> {
        if (!testSKU(sku))
            throw new HttpException('Invalid SKU!', HttpStatus.BAD_REQUEST);

        try {
            stringify(parseSKU(sku));
        } catch (err) {
            throw new HttpException('Invalid sku!', HttpStatus.BAD_REQUEST);
        }

        try {
            const when = await this.makerService.enqueue(sku, true);

            return {
                enqueued: true,
                expected: when,
            };
        } catch (err) {
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                error: 'We already have 5 or more of that item in our queue.',
            });
        }
    }

    @Get('/overview/human')
    @ApiOperation({
        summary:
            'Return an array of items we have records on, please use /overview instead if you dont need the data.',
    })
    async getHumanOverview(
        @Query('skip', ParseIntPipe) skip?: number
    ): Promise<{
        items: { image: ItemImages; sku: string; name: string }[];
        cursor: { skip: number };
    }> {
        return {
            items: await this.snapshotsService.getHumanReadableOverview(skip),
            cursor: {
                skip,
            },
        };
    }

    @Get('/overview')
    @ApiOperation({
        summary:
            'Return an array with SKUs that includes all items we have records on as of this moment.',
    })
    @ApiOkResponse({
        type: GetSnapshotsOverview,
    })
    async getOverview(): Promise<{ items: string[]; amount: number }> {
        const overview = await this.snapshotsService.getOverview();

        return { items: overview, amount: overview.length };
    }
}
