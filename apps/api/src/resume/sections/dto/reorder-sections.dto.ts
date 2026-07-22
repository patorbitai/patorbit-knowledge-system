
import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SectionOrderItem {
  @IsString()
  id: string;

  @IsInt()
  sortOrder: number;
}

export class ReorderSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  orders: SectionOrderItem[];
}
