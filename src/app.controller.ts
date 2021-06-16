import {
    BadRequestException,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiHeader,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { GetSnapshotsOverview } from './common/api-responses';
import { testSKU } from './lib/skus';
import { MakerService } from './maker/maker.service';
import { SnapshotsService } from './index/snapshots/snapshots.service';

@ApiTags('index')
@Controller('')
export class AppController {
    constructor(
        private snapshotsService: SnapshotsService,
        private makerService: MakerService
    ) {}

    @Post('/request/:sku')
    @ApiOperation({
        summary:
            'Request an item to be snapshotted, returns an expected unix timestamp on when it (if all goes well) is accessible.',
    })
    @UseGuards(AuthGuard('api-key'))
    @ApiHeader({
        name: 'SNAPSHOT_KEY',
        description:
            'This key is required for this endpoint to work, please get this from aethez#6403 on discord. This is to prevent abuse, you can still use all the other endpoints without a key.',
    })
    async request(
        @Param('sku') sku: string
    ): Promise<{ enqueued: boolean; expected: number }> {
        if (!testSKU(sku))
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                error: 'Improper SKU',
            });

        try {
            const when = await this.makerService.enqueue(sku);

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
