import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { LeadsModule } from './leads/leads.module';
import { AiModule } from './ai/ai.module';
import { Lead } from './leads/entities/lead.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Database — credentials are read from env vars
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'leads_db'),
        entities: [Lead],
        // For a 6-hour exercise we let TypeORM sync the schema. In production
        // we would disable this and rely exclusively on migrations.
        synchronize: true,
        logging: false,
      }),
    }),

    // Rate limiting (defaults: 60 requests / minute / IP)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get<string>('THROTTLE_TTL', '60')) * 1000,
          limit: Number(config.get<string>('THROTTLE_LIMIT', '60')),
        },
      ],
    }),

    LeadsModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
