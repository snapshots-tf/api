import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional } from 'class-validator';

class QuerySnapshotDTO {
    @IsInt()
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    quality: number;

    @IsNumber()
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    craft: number;

    @IsBoolean()
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Boolean)
    oldestFirst: boolean;
}

export default QuerySnapshotDTO;
