import { IsString, MaxLength } from 'class-validator';

export class AskSupportAiDto {
  @IsString()
  @MaxLength(2000)
  question!: string;
}
