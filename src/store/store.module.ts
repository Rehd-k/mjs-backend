import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './entities/store.entity';
import { StoreHistory, StoreHistorySchema } from './entities/store.history.entity';
import { StoreHistoryService } from './store.history.service';
import { StoreHistortyController } from './history.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Store.name, schema: StoreSchema },
    { name: StoreHistory.name, schema: StoreHistorySchema }
  ])],
  controllers: [StoreController, StoreHistortyController],
  providers: [StoreService, StoreHistoryService],
  exports: [MongooseModule]
})
export class StoreModule { }
