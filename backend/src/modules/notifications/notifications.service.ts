import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity.js';
import { NotificationResponseDto, CreateNotificationDto } from './dto/index.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<NotificationResponseDto[]> {
    this.logger.debug(`Fetching notifications for user: ${userId}`);

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');

    if (options?.unreadOnly) {
      query.andWhere('notification.read = :read', { read: false });
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    const notifications = await query.getMany();
    return notifications.map(n => this.mapToDto(n));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.debug(`Creating notification for user: ${dto.userId}`);

    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      link: dto.link,
    });

    await this.notificationRepository.save(notification);
    return this.mapToDto(notification);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();

    await this.notificationRepository.save(notification);
    return this.mapToDto(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async deleteOld(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
      read: true,
    });

    return result.affected || 0;
  }

  // Helper methods to create specific notification types
  async notifyMention(
    userId: string,
    actorId: string,
    actorName: string,
    pageId: string,
    pageTitle: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.MENTION,
      title: `${actorName} mentioned you`,
      message: `in "${pageTitle}"`,
      data: { pageId, actorId, actorName },
      link: `/page/${pageId}`,
    });
  }

  async notifyComment(
    userId: string,
    actorId: string,
    actorName: string,
    pageId: string,
    commentId: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.COMMENT,
      title: `${actorName} commented`,
      message: `on a page you follow`,
      data: { pageId, commentId, actorId, actorName },
      link: `/page/${pageId}#comment-${commentId}`,
    });
  }

  async notifyShare(
    userId: string,
    actorId: string,
    actorName: string,
    pageId: string,
    pageTitle: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.SHARE,
      title: `${actorName} shared a page with you`,
      message: `"${pageTitle}"`,
      data: { pageId, actorId, actorName },
      link: `/page/${pageId}`,
    });
  }

  async notifyInvite(
    userId: string,
    actorId: string,
    actorName: string,
    workspaceId: string,
    workspaceName: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.INVITE,
      title: `${actorName} invited you to a workspace`,
      message: `"${workspaceName}"`,
      data: { workspaceId, actorId, actorName },
      link: `/workspace/${workspaceId}`,
    });
  }

  private mapToDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      readAt: notification.readAt,
      link: notification.link,
      createdAt: notification.createdAt,
    };
  }
}
