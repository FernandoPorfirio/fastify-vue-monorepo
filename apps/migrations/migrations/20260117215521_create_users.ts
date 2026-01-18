import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    // Primary key
    table.increments("id").primary();

    // External reference
    table.uuid("external_reference").notNullable().unique().defaultTo(knex.raw("gen_random_uuid()"));

    // Authentication fields
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();

    // Profile fields
    table.string("name", 255).notNullable();

    // Account status
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.timestamp("email_verified_at").nullable();

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();

    // Indexes
    table.index("email");
    table.index("is_active");
    table.index("created_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}

