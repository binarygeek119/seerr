import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudiobookshelfSupport1777940000000 implements MigrationInterface {
  name = 'AddAudiobookshelfSupport1777940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" ADD "audiobookshelfMediaId" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "audiobookshelfMediaId"`
    );
  }
}
