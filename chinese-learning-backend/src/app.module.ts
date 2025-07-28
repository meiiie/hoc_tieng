import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { SharedModule } from './shared/shared.module';
import { PronunciationModule } from './modules/pronunciation/pronunciation.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // .env file in same directory
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Shared services (Global)
    SharedModule,

    // Feature modules
    PronunciationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
