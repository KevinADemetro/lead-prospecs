import { Module } from '@nestjs/common';
import { PlacesClient } from './places.client';

@Module({
  providers: [PlacesClient],
  exports: [PlacesClient],
})
export class PlacesModule {}
