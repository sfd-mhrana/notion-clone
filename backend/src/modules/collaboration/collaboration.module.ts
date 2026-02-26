import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CollaborationGateway } from './collaboration.gateway.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    WorkspacesModule,
  ],
  providers: [CollaborationGateway],
  exports: [CollaborationGateway],
})
export class CollaborationModule {}
