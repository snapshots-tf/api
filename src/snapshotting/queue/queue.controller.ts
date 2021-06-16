import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import {
    ApiExcludeEndpoint,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ClearQueue, GetQueueStatus } from 'src/common/api-responses';
import { QueueService } from './queue.service';

@Controller('queue')
@ApiTags('queue')
export class QueueController {
    constructor(private queueService: QueueService) {}

    @Get()
    @ApiOperation({
        summary: 'Get the current queue status!',
    })
    @ApiOkResponse({
        type: GetQueueStatus,
    })
    async queue(): Promise<{ failed: number; waiting: number }> {
        return await this.queueService.getQueueStatus();
    }

    @Post('/clear')
    @ApiExcludeEndpoint()
    async clear(@Param('key') key: string): Promise<{ cleared: boolean }> {
        if (key !== 'SECRET_KEY') return;

        await this.queueService.clearQueue();

        return {
            cleared: true,
        };
    }
}
