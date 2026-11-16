import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Idempotent repair: allow book/music media rows without a TMDB id.
 */
export class MakeMediaTmdbIdNullable1777930000000 implements MigrationInterface {
  name = 'MakeMediaTmdbIdNullable1777930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('media');

    if (!table) {
      return;
    }

    const tmdbCol = table.findColumnByName('tmdbId');
    if (tmdbCol && !tmdbCol.isNullable) {
      await queryRunner.query(
        `ALTER TABLE "media" ALTER COLUMN "tmdbId" DROP NOT NULL`
      );
    }
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
