import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Ensure3dMovieColumns1781800000000 implements MigrationInterface {
  name = 'Ensure3dMovieColumns1781800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD COLUMN IF NOT EXISTS "is3d" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "status3d" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "serviceId3d" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "externalServiceId3d" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "externalServiceSlug3d" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "ratingKey3d" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "jellyfinMediaId3d" varchar`
    );
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
