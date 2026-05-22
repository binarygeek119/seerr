import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Add3dMovieJellyfinColumns1777910000001
  implements MigrationInterface
{
  name = 'Add3dMovieJellyfinColumns1777910000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('media');
    if (!table?.findColumnByName('ratingKey3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD "ratingKey3d" character varying`
      );
    }
    if (!table?.findColumnByName('jellyfinMediaId3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD "jellyfinMediaId3d" character varying`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "jellyfinMediaId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ratingKey3d"`);
  }
}
