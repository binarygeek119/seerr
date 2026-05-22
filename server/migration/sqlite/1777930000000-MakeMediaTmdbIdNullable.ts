import type { MigrationInterface, QueryRunner } from 'typeorm';

type SqliteColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

/**
 * Repair migration: later table rebuilds left media.tmdbId NOT NULL, which breaks
 * book (and music) rows that use foreignBookId/mbId instead.
 */
export class MakeMediaTmdbIdNullable1777930000000 implements MigrationInterface {
  name = 'MakeMediaTmdbIdNullable1777930000000';

  private buildColumnDefinition(col: SqliteColumnInfo): string {
    if (col.pk) {
      return `"${col.name}" integer PRIMARY KEY AUTOINCREMENT NOT NULL`;
    }

    let definition = `"${col.name}" ${col.type}`;

    if (col.name !== 'tmdbId' && col.notnull) {
      definition += ' NOT NULL';
    }

    if (col.dflt_value !== null && col.dflt_value !== undefined) {
      definition += ` DEFAULT ${col.dflt_value}`;
    }

    return definition;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = (await queryRunner.query(
      `PRAGMA table_info('media')`
    )) as SqliteColumnInfo[];

    const tmdbCol = cols.find((c) => c.name === 'tmdbId');
    if (!tmdbCol || tmdbCol.notnull === 0) {
      return;
    }

    const indexes = (await queryRunner.query(
      `SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'media' AND sql IS NOT NULL`
    )) as { name: string; sql: string }[];

    const columnNames = cols.map((c) => `"${c.name}"`).join(', ');
    const columnDefs = cols.map((c) => this.buildColumnDefinition(c)).join(', ');
    const tvdbConstraint = cols.some((c) => c.name === 'tvdbId')
      ? ', CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId")'
      : '';

    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index.name}"`);
    }

    await queryRunner.query(
      `CREATE TABLE "temporary_media" (${columnDefs}${tvdbConstraint})`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_media"(${columnNames}) SELECT ${columnNames} FROM "media"`
    );
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`ALTER TABLE "temporary_media" RENAME TO "media"`);

    for (const index of indexes) {
      await queryRunner.query(index.sql);
    }

    await queryRunner.query(`PRAGMA foreign_keys = ON`);
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
