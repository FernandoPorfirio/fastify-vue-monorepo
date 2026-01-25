import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_profiles', table => {
    // Primary key
    table.increments('id').primary()

    // Foreign keys
    table.integer('user_id').unsigned().notNullable()
    table.integer('profile_id').unsigned().notNullable()
    table.integer('tenant_id').unsigned().notNullable()

    // Status
    table.boolean('is_active').notNullable().defaultTo(true)

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())

    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.foreign('profile_id').references('id').inTable('profiles').onDelete('CASCADE')
    table.foreign('tenant_id').references('id').inTable('tenants').onDelete('CASCADE')

    // Unique constraint to prevent duplicate entries
    table.unique(['user_id', 'profile_id', 'tenant_id'])

    // Indexes
    table.index('user_id')
    table.index('profile_id')
    table.index('tenant_id')
    table.index('is_active')
    table.index(['user_id', 'tenant_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_profiles')
}
