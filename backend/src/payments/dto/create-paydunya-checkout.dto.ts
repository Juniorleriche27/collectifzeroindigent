import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaydunyaCheckoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  customer_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;
}
