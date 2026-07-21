// apps/api/src/credential/dto/update-credential.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCredentialDto } from './create-credential.dto';

export class UpdateCredentialDto extends PartialType(CreateCredentialDto) {}
