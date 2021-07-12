import {
    BadRequestException,
    CacheTTL,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
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
import { GetSnapshotsOverview, GetStats } from './common/api-responses';
import { testSKU } from './lib/skus';
import { MakerService } from './snapshotting/maker/maker.service';
import { SnapshotsService } from './index/snapshots/snapshots.service';
import { ListingsService } from './index/listings/listings.service';
import { stringify, parseSKU } from 'tf2-item-format/static';
import { getImageFromSKU } from './lib/images';
import { BadRequestError } from 'passport-headerapikey';
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

        let matches = [];

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
                matches.push({ name: skuName, sku: skus[i] });
            else if (skuName.toLowerCase() === query.toLowerCase()) {
                matches.push({ name: skuName, sku: skus[i] });
                break;
            }
        }

        return { results: matches };
    }

    @Get('/stats')
    @ApiOperation({
        summary: 'Get API statistics. Cached for 900 seconds.',
    })
    @ApiOkResponse({
        type: GetStats,
    })
    @CacheTTL(900)
    stats(): { listings: number; users: number; snapshots: number } {
        return this.statsService.getStats();
    }

    @Post('/request/:defindex')
    @ApiOperation({
        summary: 'Request a defindex to be snapshotted.',
    })
    @UseGuards(AuthGuard('api-key'))
    @ApiHeader({
        name: 'SNAPSHOT_KEY',
        description:
            "This key is required for this endpoint to work, get it by first going to /auth/steam then /me/api-key. It's bound to the account you sign in with.",
    })
    async request(
        @Param('defindex') defindex: string
    ): Promise<{ enqueued: boolean; expected: number }> {
        if (defindex.indexOf(';') !== -1)
            throw new BadRequestError('Incorrect defindex.');

        try {
            stringify(parseSKU(defindex + ';6'));
        } catch (err) {
            throw new BadRequestError('Incorrect defindex.');
        }

        try {
            const when = await this.makerService.enqueue(defindex);

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
