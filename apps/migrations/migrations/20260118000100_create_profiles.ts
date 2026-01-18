import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profiles", (table) => {
    // Primary key
    table.increments("id").primary();

    // External reference
    table.uuid("external_reference").notNullable().unique().defaultTo(knex.raw("gen_random_uuid()"));

    // Profile information
    table.string("name", 100).notNullable().unique();
    table.string("description", 500).nullable();

    // Status
    table.boolean("is_active").notNullable().defaultTo(true);

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();

    // Indexes
    table.index("name");
    table.index("is_active");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("profiles");
}
