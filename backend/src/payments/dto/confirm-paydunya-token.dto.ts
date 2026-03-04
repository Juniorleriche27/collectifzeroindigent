import { IsString, MaxLength } from 'class-validator';

export class ConfirmPaydunyaTokenDto {
  @IsString()
  @MaxLength(120)
  token!: string;
}
