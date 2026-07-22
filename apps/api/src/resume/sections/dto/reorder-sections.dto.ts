
import { Type } from 'class-transformer';
import { IsArray, IsInt,IsString, ValidateNested } from 'class-validator';

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
