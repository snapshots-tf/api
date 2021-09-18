import { Injectable } from '@nestjs/common';
import { Interval, Timeout } from '@nestjs/schedule';
import { KeyPricesService } from '../keyprices.service';
import { MakerService } from '../maker/maker.service';

@Injectable()
export class TasksService {
    constructor(
        private makerService: MakerService,
        private keyPricesService: KeyPricesService
    ) {}

    @Timeout(0)
    @Interval(14400)
    checkKeyPrices(): void {
        this.keyPricesService.check().catch(() => null);
    }

    @Timeout(5 * 1000)
    startQueue(): void {
        this.makerService.process();
    }
}
