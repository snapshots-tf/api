import * as SteamID from 'steamid';

import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseSteamIDPipe implements PipeTransform<string, string> {
    transform(value: string, metadata: ArgumentMetadata): string {
        try {
            new SteamID(value);
        } catch (err) {
            console.error(err);
            throw new BadRequestException('Invalid steamID');
        }

        if (!new SteamID(value).isValid()) {
            throw new BadRequestException('Invalid steamID');
        }

        return value;
    }
}
