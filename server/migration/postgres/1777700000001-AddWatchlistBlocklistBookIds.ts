import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatchlistBlocklistBookIds1777700000001
  implements MigrationInterface
{
  name = 'AddWatchlistBlocklistBookIds1777700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "watchlist" ADD "foreignBookId" character varying`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_watchlist_foreign_book_id" ON "watchlist" ("foreignBookId") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UNIQUE_USER_FOREIGN_BOOK" ON "watchlist" ("foreignBookId", "requestedById") WHERE "foreignBookId" IS NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "blocklist" ADD "foreignBookId" character varying`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_blocklist_foreign_book_id" ON "blocklist" ("foreignBookId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_blocklist_foreign_book_id"`);
    await queryRunner.query(
      `ALTER TABLE "blocklist" DROP COLUMN "foreignBookId"`
    );
    await queryRunner.query(`DROP INDEX "public"."UNIQUE_USER_FOREIGN_BOOK"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_watchlist_foreign_book_id"`);
    await queryRunner.query(
      `ALTER TABLE "watchlist" DROP COLUMN "foreignBookId"`
    );
  }
}
