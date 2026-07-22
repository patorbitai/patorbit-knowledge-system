
import { IsNotEmpty,IsString } from 'class-validator';

export class AddTagDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
