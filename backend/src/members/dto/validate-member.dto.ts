import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateMemberDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsIn(['engaged', 'entrepreneur', 'org_leader'])
  cellule_primary?: 'engaged' | 'entrepreneur' | 'org_leader';

  @IsOptional()
  @IsIn(['engaged', 'entrepreneur', 'org_leader'])
  cellule_secondary?: 'engaged' | 'entrepreneur' | 'org_leader' | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
