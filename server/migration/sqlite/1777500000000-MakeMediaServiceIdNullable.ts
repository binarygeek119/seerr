import type { MigrationInterface, QueryRunner } from 'typeorm';

type SqliteColumnInfo = {
  name: string;
  notnull: number;
};

export class MakeMediaServiceIdNullable1777500000000
  implements MigrationInterface
{
  name = 'MakeMediaServiceIdNullable1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = (await queryRunner.query(
      `PRAGMA table_info('media')`
    )) as SqliteColumnInfo[];

    const serviceIdCol = cols.find((c) => c.name === 'serviceId');
    if (!serviceIdCol || serviceIdCol.notnull === 0) {
      return;
    }

    const hasMbId = cols.some((c) => c.name === 'mbId');

    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_7157aad07c73f6a6ae3bbd5ef5"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_41a289eb1fa489c1bc6f38d9c3"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_7ff2d11f6a83cb52386eaebe74"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_6c866e76dd595ad15b8c5bf9c1"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_c730c2d67f271a372c39a07b7e"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_5d6218de4f547909391a5c1347"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_f8233358694d1677a67899b90a"`
    );

    if (hasMbId) {
      await queryRunner.query(
        `CREATE TABLE "temporary_media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "tmdbId" integer, "tvdbId" integer, "imdbId" varchar, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "mediaAddedAt" datetime DEFAULT (CURRENT_TIMESTAMP), "serviceId" integer DEFAULT (0), "serviceId4k" integer, "externalServiceId" integer, "externalServiceId4k" integer, "externalServiceSlug" varchar, "externalServiceSlug4k" varchar, "ratingKey" varchar, "ratingKey4k" varchar, "jellyfinMediaId" varchar, "jellyfinMediaId4k" varchar, "mbId" varchar, CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId"))`
      );
      await queryRunner.query(
        `INSERT INTO "temporary_media"("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k", "mbId") SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k", "mbId" FROM "media"`
      );
    } else {
      await queryRunner.query(
        `CREATE TABLE "temporary_media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "mediaType" varchar NOT NULL, "tmdbId" integer NOT NULL, "tvdbId" integer, "imdbId" varchar, "status" integer NOT NULL DEFAULT (1), "status4k" integer NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastSeasonChange" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "mediaAddedAt" datetime DEFAULT (CURRENT_TIMESTAMP), "serviceId" integer DEFAULT (0), "serviceId4k" integer, "externalServiceId" integer, "externalServiceId4k" integer, "externalServiceSlug" varchar, "externalServiceSlug4k" varchar, "ratingKey" varchar, "ratingKey4k" varchar, "jellyfinMediaId" varchar, "jellyfinMediaId4k" varchar, CONSTRAINT "UQ_41a289eb1fa489c1bc6f38d9c3c" UNIQUE ("tvdbId"))`
      );
      await queryRunner.query(
        `INSERT INTO "temporary_media"("id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k") SELECT "id", "mediaType", "tmdbId", "tvdbId", "imdbId", "status", "status4k", "createdAt", "updatedAt", "lastSeasonChange", "mediaAddedAt", "serviceId", "serviceId4k", "externalServiceId", "externalServiceId4k", "externalServiceSlug", "externalServiceSlug4k", "ratingKey", "ratingKey4k", "jellyfinMediaId", "jellyfinMediaId4k" FROM "media"`
      );
    }

    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_media" RENAME TO "media"`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_7157aad07c73f6a6ae3bbd5ef5" ON "media" ("tmdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41a289eb1fa489c1bc6f38d9c3" ON "media" ("tvdbId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff2d11f6a83cb52386eaebe74" ON "media" ("imdbId") `
    );
    if (hasMbId) {
      await queryRunner.query(
        `CREATE INDEX "IDX_6c866e76dd595ad15b8c5bf9c1" ON "media" ("mbId") `
      );
    }
    await queryRunner.query(
      `CREATE INDEX "IDX_c730c2d67f271a372c39a07b7e" ON "media" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d6218de4f547909391a5c1347" ON "media" ("status4k") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8233358694d1677a67899b90a" ON "media" ("tmdbId", "mediaType") `
    );

    await queryRunner.query(`PRAGMA foreign_keys = ON`);
  }

  public async down(): Promise<void> {
    // Intentionally empty: restoring NOT NULL would fail for NULL serviceId rows.
  }
}
