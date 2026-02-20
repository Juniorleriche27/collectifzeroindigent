import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsIn(['association', 'enterprise'])
  type!: string;
}
