import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const normalized = emptyStringsToUndefined(value);
    const result = this.schema.safeParse(normalized ?? {});
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Dados inválidos';
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message,
      });
    }
    return result.data;
  }
}

function emptyStringsToUndefined(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        entry === '' ? undefined : entry,
      ]),
    );
  }
  return value;
}
