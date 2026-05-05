import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'alice' })
  username: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: '2026-05-04T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-04T00:00:00.000Z' })
  updatedAt: string;
}
