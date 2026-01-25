import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', table => {
    // Primary key
    table.increments('id').primary()

    // Context
    table.integer('tenant_id').unsigned().nullable()
    table.integer('user_id').unsigned().nullable()

    // Action details
    table.string('action', 50).notNullable()
    table.string('entity', 100).notNullable()

    // Additional data
    table.jsonb('metadata').nullable()

    // Timestamp
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())

    // Foreign key constraints
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('SET NULL')
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')

    // Indexes
    table.index('tenant_id')
    table.index('created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs')
}
