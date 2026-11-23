import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { PainPointsController } from './pain-points.controller';
import { PainPointsService } from './pain-points.service';

@Module({
  imports: [PersistenceModule],
  controllers: [PainPointsController],
  providers: [PainPointsService],
  exports: [PainPointsService],
})
export class PainPointsModule {}
