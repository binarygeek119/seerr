import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Idempotent repair: ensure mbId exists on media/watchlist/blocklist (music support).
 */
export class EnsureMusicMbIdColumns1777920000000 implements MigrationInterface {
  name = 'EnsureMusicMbIdColumns1777920000000';

  private async ensureMbIdColumn(
    queryRunner: QueryRunner,
    tableName: 'media' | 'watchlist' | 'blocklist',
    indexName: string
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    if (!table.findColumnByName('mbId')) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD "mbId" character varying`
      );
    }

    const hasIndex = table.indices.some((idx) => idx.name === indexName);

    if (!hasIndex) {
      await queryRunner.query(
        `CREATE INDEX "${indexName}" ON "${tableName}" ("mbId")`
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureMbIdColumn(
      queryRunner,
      'media',
      'IDX_6c866e76dd595ad15b8c5bf9c1'
    );
    await this.ensureMbIdColumn(
      queryRunner,
      'watchlist',
      'IDX_a40b88a30fc50cf10264e279c9'
    );
    await this.ensureMbIdColumn(
      queryRunner,
      'blocklist',
      'IDX_4f7c7041c1792b568be902f097'
    );
  }

  public async down(): Promise<void> {
    // Intentionally empty — repair migration
  }
}
