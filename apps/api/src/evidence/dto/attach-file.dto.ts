
import { IsInt,IsNotEmpty, IsString } from 'class-validator';

export class AttachFileDto {
    @IsString()
    @IsNotEmpty()
    storageKey: string;

    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsString()
    @IsNotEmpty()
    fileType: string;

    @IsInt()
    @IsNotEmpty()
    fileSize: number;
}
