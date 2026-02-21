import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['active', 'pending'])
  status?: string;

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
  @IsIn(['personal', 'association', 'enterprise'])
  join_mode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  org_name?: string;

  @IsOptional()
  @IsString()
  organisation_id?: string;
}
