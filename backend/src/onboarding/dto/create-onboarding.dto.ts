import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
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
  @IsIn(['engaged', 'entrepreneur', 'org_leader'])
  cellule_secondary?: 'engaged' | 'entrepreneur' | 'org_leader';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  gender?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  age_range?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  education_level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  profession_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  locality?: string;

  @IsOptional()
  @IsBoolean()
  mobility?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  mobility_zones?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engagement_domains?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  engagement_frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  engagement_recent_action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  business_stage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  business_sector?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  business_needs?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  org_role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  org_name_declared?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  skills?: Array<{ name: string; level: string }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills_tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests_tags?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  odd_priorities?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(800)
  goal_3_6_months?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  support_types?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  availability?: string;

  @IsOptional()
  @IsIn(['whatsapp', 'email', 'call'])
  contact_preference?: 'whatsapp' | 'email' | 'call';

  @IsOptional()
  @IsBoolean()
  consent_terms?: boolean;

  @IsOptional()
  @IsBoolean()
  consent_analytics?: boolean;

  @IsOptional()
  @IsBoolean()
  consent_ai_training_agg?: boolean;

  @IsOptional()
  @IsBoolean()
  partner_request?: boolean;

  @IsOptional()
  @IsIn(['association', 'enterprise'])
  org_type?: 'association' | 'enterprise';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  org_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  income_range?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  income_stability?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  dependents_count?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  housing_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  food_security?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  health_access?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  savings_level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  debt_level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  employment_duration_if_searching?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  urgent_needs?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  recent_shock?: string;

  @IsOptional()
  @IsBoolean()
  disability_or_limitation?: boolean;

  @IsOptional()
  @IsString()
  organisation_id?: string;
}
