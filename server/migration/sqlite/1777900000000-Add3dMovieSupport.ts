import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Add3dMovieSupport1777900000000 implements MigrationInterface {
  name = 'Add3dMovieSupport1777900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD COLUMN "is3d" boolean NOT NULL DEFAULT (0)`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "status3d" integer NOT NULL DEFAULT (0)`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "serviceId3d" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "externalServiceId3d" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "externalServiceSlug3d" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "ratingKey3d" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "jellyfinMediaId3d" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "jellyfinMediaId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ratingKey3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "externalServiceSlug3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "externalServiceId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "serviceId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "status3d"`);
    await queryRunner.query(`ALTER TABLE "media_request" DROP COLUMN "is3d"`);
  }
}
