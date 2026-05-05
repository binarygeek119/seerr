import { MediaStatus, MediaType } from '@server/constants/media';
import dataSource from '@server/datasource';
import Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type { BlocklistItem } from '@server/interfaces/api/blocklistInterfaces';
import { DbAwareColumn } from '@server/utils/DbColumnHelper';
import type { EntityManager } from 'typeorm';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ZodNumber, ZodOptional, ZodString } from 'zod';

@Entity()
export class Blocklist implements BlocklistItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar' })
  public mediaType: MediaType;

  @Column({ nullable: true, type: 'varchar' })
  title?: string;

  @Column({ nullable: true })
  @Index()
  public tmdbId?: number;

  @Column({ nullable: true })
  @Index()
  public mbId?: string;

  @Column({ nullable: true })
  @Index()
  public foreignBookId?: string;

  @ManyToOne(() => User, (user) => user.id, {
    eager: true,
  })
  @Index()
  user?: User;

  @OneToOne(() => Media, (media) => media.blocklist, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public media: Media;

  @Column({ nullable: true, type: 'varchar' })
  public blocklistedTags?: string;

  @DbAwareColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  constructor(init?: Partial<Blocklist>) {
    Object.assign(this, init);
  }

  public static async addToBlocklist(
    {
      blocklistRequest,
    }: {
      blocklistRequest: {
        mediaType: MediaType;
        title?: ZodOptional<ZodString>['_output'];
        tmdbId?: ZodNumber['_output'];
        mbId?: ZodOptional<ZodString>['_output'];
        foreignBookId?: ZodOptional<ZodString>['_output'];
        blocklistedTags?: string;
      };
    },
    entityManager?: EntityManager
  ): Promise<void> {
    const em = entityManager ?? dataSource;
    const blocklist = new this({
      ...blocklistRequest,
    });

    const mediaRepository = em.getRepository(Media);
    const where =
      blocklistRequest.mediaType === MediaType.MUSIC && blocklistRequest.mbId
        ? { mbId: blocklistRequest.mbId, mediaType: blocklistRequest.mediaType }
        : blocklistRequest.mediaType === MediaType.BOOK &&
            blocklistRequest.foreignBookId
          ? {
              foreignBookId: blocklistRequest.foreignBookId,
              mediaType: blocklistRequest.mediaType,
            }
          : {
              tmdbId: blocklistRequest.tmdbId,
              mediaType: blocklistRequest.mediaType,
            };
    let media = await mediaRepository.findOne({
      where,
    });

    const blocklistRepository = em.getRepository(this);

    await blocklistRepository.save(blocklist);

    if (!media) {
      media = new Media({
        tmdbId: blocklistRequest.tmdbId,
        mbId: blocklistRequest.mbId,
        foreignBookId: blocklistRequest.foreignBookId,
        status: MediaStatus.BLOCKLISTED,
        status4k: MediaStatus.BLOCKLISTED,
        mediaType: blocklistRequest.mediaType,
        blocklist: Promise.resolve(blocklist),
      });

      await mediaRepository.save(media);
    } else {
      media.blocklist = Promise.resolve(blocklist);
      media.status = MediaStatus.BLOCKLISTED;
      media.status4k = MediaStatus.BLOCKLISTED;

      await mediaRepository.save(media);
    }
  }
}
