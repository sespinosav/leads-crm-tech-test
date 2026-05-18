import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lead])],
  controllers: [LeadsController, WebhookController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
