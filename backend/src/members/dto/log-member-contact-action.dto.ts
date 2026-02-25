import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LogMemberContactActionDto {
  @IsUUID()
  member_id!: string;

  @IsIn(['email', 'phone'])
  channel!: 'email' | 'phone';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
