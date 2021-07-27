import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class QuerySnapshotsByIDS {
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    @Transform(({ value }) => value.split(','))
    @ArrayMaxSize(5)
    ids?: string[];
}
