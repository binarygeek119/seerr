import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Add3dMovieSupport1777900000000 implements MigrationInterface {
  name = 'Add3dMovieSupport1777900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "is3d" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD "status3d" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(`ALTER TABLE "media" ADD "serviceId3d" integer`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "externalServiceId3d" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD "externalServiceSlug3d" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD "ratingKey3d" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD "jellyfinMediaId3d" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "jellyfinMediaId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ratingKey3d"`);
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "externalServiceSlug3d"`
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "externalServiceId3d"`
    );
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "serviceId3d"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "status3d"`);
    await queryRunner.query(`ALTER TABLE "media_request" DROP COLUMN "is3d"`);
  }
}
