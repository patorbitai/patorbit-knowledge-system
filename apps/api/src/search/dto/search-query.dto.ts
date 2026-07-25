// apps/api/src/search/dto/search-query.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q: string;
}
