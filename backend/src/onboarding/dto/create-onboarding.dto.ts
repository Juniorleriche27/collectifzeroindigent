import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOnboardingDto {
  @IsString()
  @MaxLength(120)
  first_name!: string;

  @IsString()
  @MaxLength(120)
  last_name!: string;

  @IsString()
  @MaxLength(120)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  region_id!: string;

  @IsString()
  prefecture_id!: string;

  @IsString()
  commune_id!: string;

  @IsIn(['personal', 'association', 'enterprise'])
  join_mode!: string;

  @IsOptional()
  @IsIn(['engaged', 'entrepreneur', 'org_leader'])
  cellule_primary?: 'engaged' | 'entrepreneur' | 'org_leader';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  org_name?: string;

  @IsOptional()
  @IsString()
  organisation_id?: string;
}
