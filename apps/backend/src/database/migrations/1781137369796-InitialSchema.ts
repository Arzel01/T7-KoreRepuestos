import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781137369796 implements MigrationInterface {
  name = 'InitialSchema1781137369796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensiones requeridas por el esquema: uuid_generate_v4() y el tipo citext.
    // Idempotentes — en Supabase citext no viene habilitado por defecto.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    // pg_trgm: requerido por similarity() en ProductsRepository.searchByName.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'cliente', 'asesor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" citext NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "phone" character varying(30), "role" "public"."users_role_enum" NOT NULL DEFAULT 'cliente', "is_active" boolean NOT NULL DEFAULT true, "email_verified" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "refresh_token_hash" character varying(128) NOT NULL, "user_agent" text, "ip_address" character varying(45), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d6185b2849a1e4d0c067a57ca8" ON "sessions" ("refresh_token_hash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "parent_id" uuid, "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f151d414daab0290f65b517ed" ON "product_categories" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f314a8b42f88d87b2dcb7fc491" ON "product_categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying(64) NOT NULL, "name" character varying(200) NOT NULL, "description" text, "category_id" uuid, "brand" character varying(120), "price" numeric(12,2) NOT NULL, "cost" numeric(12,2), "stock" integer NOT NULL DEFAULT '0', "min_stock" integer NOT NULL DEFAULT '0', "unit" character varying(30) NOT NULL DEFAULT 'unidad', "image_url" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a5f6868c96e0069e699f33e12" ON "products" ("category_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_5f151d414daab0290f65b517ed4" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_5f151d414daab0290f65b517ed4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9a5f6868c96e0069e699f33e12"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f314a8b42f88d87b2dcb7fc491"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5f151d414daab0290f65b517ed"`);
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d6185b2849a1e4d0c067a57ca8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
