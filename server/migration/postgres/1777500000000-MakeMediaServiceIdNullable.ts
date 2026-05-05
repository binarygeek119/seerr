import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeMediaServiceIdNullable1777500000000
  implements MigrationInterface
{
  name = 'MakeMediaServiceIdNullable1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media'
      AND column_name = 'serviceId'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "media" ALTER COLUMN "serviceId" DROP NOT NULL;
  END IF;
END $$;
`);
  }

  public async down(): Promise<void> {
    // Intentionally empty: re-adding NOT NULL would fail if any row has NULL
    // and would contradict the Media entity (nullable serviceId).
  }
}
