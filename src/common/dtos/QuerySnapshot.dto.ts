import { ApiProperty } from '@nestjs/swagger';

class QuerySnapshotDTO {
    @ApiProperty()
    oldest: boolean;
}

export default QuerySnapshotDTO;
