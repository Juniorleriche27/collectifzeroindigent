import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsIn(['community', 'direct'])
  conversation_type!: 'community' | 'direct';

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsIn(['all', 'region', 'prefecture', 'commune'])
  scope_type?: 'all' | 'region' | 'prefecture' | 'commune';

  @IsOptional()
  @IsString()
  region_id?: string;

  @IsOptional()
  @IsString()
  prefecture_id?: string;

  @IsOptional()
  @IsString()
  commune_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  participant_member_ids?: string[];
}
