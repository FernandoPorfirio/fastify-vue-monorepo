import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("refresh_tokens", (table) => {
    // Primary key
    table.increments("id").primary();

    // User reference
    table.integer("user_id").unsigned().notNullable();

    // Token details
    table.string("token", 500).notNullable().unique();
    table.timestamp("expires_at").notNullable();
    table.timestamp("revoked_at").nullable();

    // Request details (optional, for security)
    table.string("ip_address", 45).nullable();
    table.string("user_agent", 500).nullable();

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");

    // Indexes
    table.index("user_id");
    table.index("token");
    table.index("expires_at");
    table.index(["user_id", "revoked_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("refresh_tokens");
}
