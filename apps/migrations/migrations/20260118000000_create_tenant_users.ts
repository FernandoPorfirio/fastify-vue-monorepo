import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tenant_users", (table) => {
    // Primary key
    table.increments("id").primary();

    // Foreign keys
    table.integer("tenant_id").unsigned().notNullable();
    table.integer("user_id").unsigned().notNullable();

    // Status
    table.boolean("is_active").notNullable().defaultTo(true);

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("tenant_id").references("id").inTable("tenants").onDelete("CASCADE");
    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");

    // Unique constraint to prevent duplicate entries
    table.unique(["tenant_id", "user_id"]);

    // Indexes
    table.index("tenant_id");
    table.index("user_id");
    table.index("is_active");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tenant_users");
}
