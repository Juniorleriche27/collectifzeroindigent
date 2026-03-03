import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const donationStatuses = [
  'pledged',
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
] as const;

export class UpdateDonationDto {
  @IsOptional()
  @IsIn(donationStatuses)
  status?: (typeof donationStatuses)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  payment_ref?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  payment_provider?: string;
}
