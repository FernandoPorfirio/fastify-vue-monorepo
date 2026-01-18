import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("invites", (table) => {
    // Primary key
    table.increments("id").primary();

    // External reference
    table.uuid("external_reference").notNullable().unique().defaultTo(knex.raw("gen_random_uuid()"));

    // Context
    table.integer("tenant_id").unsigned().notNullable();
    table.integer("invited_by").unsigned().nullable();
    table.integer("profile_id").unsigned().notNullable();

    // Invite details
    table.string("email", 255).notNullable();
    table.string("token", 255).notNullable().unique();

    // Status
    table.timestamp("expires_at").notNullable();
    table.timestamp("accepted_at").nullable();

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    table.foreign("tenant_id").references("id").inTable("tenants").onDelete("CASCADE");
    table.foreign("invited_by").references("id").inTable("users").onDelete("SET NULL");
    table.foreign("profile_id").references("id").inTable("profiles").onDelete("CASCADE");

    // Indexes
    table.index("tenant_id");
    table.index("email");
    table.index("token");
    table.index("expires_at");
    table.index(["tenant_id", "email"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invites");
}
