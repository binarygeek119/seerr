import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookSupport1777600000000 implements MigrationInterface {
  name = 'AddBookSupport1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media" ADD "foreignBookId" varchar`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8f2c1a9e7d3b4c5a6e9f0d1b2c" ON "media" ("foreignBookId") `
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "bookQuotaLimit" integer`
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "bookQuotaDays" integer`);
    await queryRunner.query(
      `ALTER TABLE "override_rule" ADD "readarrServiceId" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override_rule" DROP COLUMN "readarrServiceId"`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bookQuotaDays"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "bookQuotaLimit"`
    );
    await queryRunner.query(
      `DROP INDEX "IDX_8f2c1a9e7d3b4c5a6e9f0d1b2c"`
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "foreignBookId"`
    );
  }
}
