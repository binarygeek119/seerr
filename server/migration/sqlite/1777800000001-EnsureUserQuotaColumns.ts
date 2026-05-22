import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repair migration: add music/book quota columns if a prior migration was
 * recorded but did not complete (avoids settings migration 0007 failing).
 */
export class EnsureUserQuotaColumns1777800000001 implements MigrationInterface {
  name = 'EnsureUserQuotaColumns1777800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user');

    if (!table) {
      return;
    }

    if (!table.findColumnByName('musicQuotaLimit')) {
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "musicQuotaLimit" integer`
      );
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "musicQuotaDays" integer`
      );
    }

    if (!table.findColumnByName('bookQuotaLimit')) {
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "bookQuotaLimit" integer`
      );
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "bookQuotaDays" integer`
      );
    }
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
