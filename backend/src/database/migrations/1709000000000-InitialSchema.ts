import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709000000000 implements MigrationInterface {
  name = 'InitialSchema1709000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "workspace_role_enum" AS ENUM ('owner', 'admin', 'member', 'viewer')
    `);

    await queryRunner.query(`
      CREATE TYPE "block_type_enum" AS ENUM (
        'paragraph', 'heading_1', 'heading_2', 'heading_3',
        'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle',
        'code', 'quote', 'callout', 'divider',
        'image', 'video', 'file', 'embed', 'bookmark',
        'column_list', 'column', 'child_page', 'child_database',
        'table_of_contents', 'equation'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "property_type_enum" AS ENUM (
        'text', 'number', 'select', 'multi_select', 'date',
        'person', 'checkbox', 'url', 'email', 'phone',
        'formula', 'relation', 'rollup', 'files'
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying,
        "name" character varying NOT NULL,
        "avatarUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create workspaces table
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "iconEmoji" character varying NOT NULL DEFAULT '🏠',
        "owner_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspaces" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspaces_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create workspace_members table
    await queryRunner.query(`
      CREATE TABLE "workspace_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "workspace_role_enum" NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_workspace_members" UNIQUE ("workspace_id", "user_id"),
        CONSTRAINT "PK_workspace_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workspace_members_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_workspace_members_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create pages table
    await queryRunner.query(`
      CREATE TABLE "pages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL DEFAULT 'Untitled',
        "icon" character varying,
        "coverImage" character varying,
        "workspace_id" uuid NOT NULL,
        "parent_id" uuid,
        "isDatabase" boolean NOT NULL DEFAULT false,
        "isTemplate" boolean NOT NULL DEFAULT false,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "order" character varying NOT NULL DEFAULT '0',
        "created_by_id" uuid NOT NULL,
        "updated_by_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pages_workspace" FOREIGN KEY ("workspace_id")
          REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_pages_parent" FOREIGN KEY ("parent_id")
          REFERENCES "pages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_pages_created_by" FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_pages_updated_by" FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create indexes for pages
    await queryRunner.query(`CREATE INDEX "IDX_pages_workspace_id" ON "pages" ("workspace_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pages_parent_id" ON "pages" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pages_is_deleted" ON "pages" ("isDeleted")`);

    // Create blocks table
    await queryRunner.query(`
      CREATE TABLE "blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "block_type_enum" NOT NULL DEFAULT 'paragraph',
        "page_id" uuid NOT NULL,
        "parent_block_id" uuid,
        "content" jsonb NOT NULL DEFAULT '{}',
        "order" integer NOT NULL DEFAULT 0,
        "created_by_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blocks_page" FOREIGN KEY ("page_id")
          REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_blocks_parent" FOREIGN KEY ("parent_block_id")
          REFERENCES "blocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_blocks_created_by" FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create indexes for blocks
    await queryRunner.query(`CREATE INDEX "IDX_blocks_page_id" ON "blocks" ("page_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_blocks_parent_block_id" ON "blocks" ("parent_block_id")`);

    // Create database_properties table
    await queryRunner.query(`
      CREATE TABLE "database_properties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "page_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "property_type_enum" NOT NULL DEFAULT 'text',
        "config" jsonb NOT NULL DEFAULT '{}',
        "order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_database_properties" PRIMARY KEY ("id"),
        CONSTRAINT "FK_database_properties_page" FOREIGN KEY ("page_id")
          REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create index for database_properties
    await queryRunner.query(`CREATE INDEX "IDX_database_properties_page_id" ON "database_properties" ("page_id")`);

    // Enable uuid-ossp extension for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "database_properties"`);
    await queryRunner.query(`DROP TABLE "blocks"`);
    await queryRunner.query(`DROP TABLE "pages"`);
    await queryRunner.query(`DROP TABLE "workspace_members"`);
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "property_type_enum"`);
    await queryRunner.query(`DROP TYPE "block_type_enum"`);
    await queryRunner.query(`DROP TYPE "workspace_role_enum"`);
  }
}
