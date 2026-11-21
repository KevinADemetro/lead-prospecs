import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { DoresController } from './dores.controller';
import { DoresService } from './dores.service';

@Module({
  imports: [PersistenceModule],
  controllers: [DoresController],
  providers: [DoresService],
  exports: [DoresService],
})
export class DoresModule {}
