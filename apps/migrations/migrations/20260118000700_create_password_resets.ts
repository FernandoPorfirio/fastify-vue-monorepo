import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("password_resets", (table) => {
    // Primary key
    table.increments("id").primary();

    // User reference
    table.integer("user_id").unsigned().notNullable();
    table.string("email", 255).notNullable();

    // Token details
    table.string("token", 255).notNullable().unique();
    table.timestamp("expires_at").notNullable();
    table.timestamp("used_at").nullable();

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");

    // Indexes
    table.index("user_id");
    table.index("email");
    table.index("token");
    table.index("expires_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("password_resets");
}
