import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEmailCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provider?: string;

  @IsOptional()
  @IsIn(['all', 'region', 'prefecture', 'commune'])
  audience_scope?: 'all' | 'region' | 'prefecture' | 'commune';

  @IsOptional()
  @IsString()
  region_id?: string;

  @IsOptional()
  @IsString()
  prefecture_id?: string;

  @IsOptional()
  @IsString()
  commune_id?: string;
}
