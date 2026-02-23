import { IsIn, IsOptional, IsString } from 'class-validator';

export class AnnouncementScopeDto {
  @IsIn(['all', 'region', 'prefecture', 'commune'])
  scope_type!: 'all' | 'region' | 'prefecture' | 'commune';

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
