import { NotFoundException } from '@nestjs/common';
import { isEntityId } from './ids';

export const notDeleted = { deletedAt: null } as const;

export abstract class BaseRepository {
  protected notDeleted() {
    return notDeleted;
  }

  protected assertId(id: string): void {
    if (!isEntityId(id)) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  protected isUsableId(id: string): boolean {
    return isEntityId(id);
  }
}
