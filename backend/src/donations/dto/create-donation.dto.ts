import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDonationDto {
  @IsInt()
  @Min(100)
  amount_cfa!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  payment_provider?: string;
}
