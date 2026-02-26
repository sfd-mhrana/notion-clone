import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { configValidationSchema } from './config/index.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WorkspacesModule } from './modules/workspaces/workspaces.module.js';
import { PagesModule } from './modules/pages/pages.module.js';
import { BlocksModule } from './modules/blocks/blocks.module.js';
import { CollaborationModule } from './modules/collaboration/collaboration.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { DatabasesModule } from './modules/databases/databases.module.js';
import { TemplatesModule } from './modules/templates/templates.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { AIModule } from './modules/ai/ai.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // Always use migrations
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    WorkspacesModule,
    PagesModule,
    BlocksModule,
    CollaborationModule,
    SearchModule,
    FilesModule,
    DatabasesModule,
    TemplatesModule,
    IntegrationsModule,
    CommentsModule,
    AIModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
