import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repair migration: Add3dMovieSupport added is3d/status3d/etc., but a later
 * table rebuild (AddIgnoreQuotaToMediaRequest) recreated media_request without
 * the is3d column, dropping it from existing SQLite databases.
 */
export class Ensure3dMovieColumns1781800000000 implements MigrationInterface {
  name = 'Ensure3dMovieColumns1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const requestTable = await queryRunner.getTable('media_request');
    if (requestTable && !requestTable.findColumnByName('is3d')) {
      await queryRunner.query(
        `ALTER TABLE "media_request" ADD COLUMN "is3d" boolean NOT NULL DEFAULT (0)`
      );
    }

    const mediaTable = await queryRunner.getTable('media');
    if (!mediaTable) {
      return;
    }

    if (!mediaTable.findColumnByName('status3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "status3d" integer NOT NULL DEFAULT (0)`
      );
    }
    if (!mediaTable.findColumnByName('serviceId3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "serviceId3d" integer`
      );
    }
    if (!mediaTable.findColumnByName('externalServiceId3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "externalServiceId3d" integer`
      );
    }
    if (!mediaTable.findColumnByName('externalServiceSlug3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "externalServiceSlug3d" varchar`
      );
    }
    if (!mediaTable.findColumnByName('ratingKey3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "ratingKey3d" varchar`
      );
    }
    if (!mediaTable.findColumnByName('jellyfinMediaId3d')) {
      await queryRunner.query(
        `ALTER TABLE "media" ADD COLUMN "jellyfinMediaId3d" varchar`
      );
    }
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
