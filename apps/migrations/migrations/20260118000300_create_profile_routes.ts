import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('profile_routes', table => {
    // Primary key
    table.increments('id').primary()

    // Foreign keys
    table.integer('profile_id').unsigned().notNullable()
    table.integer('route_id').unsigned().notNullable()

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())

    // Foreign key constraints
    table.foreign('profile_id').references('id').inTable('profiles').onDelete('CASCADE')
    table.foreign('route_id').references('id').inTable('routes').onDelete('CASCADE')

    // Unique constraint to prevent duplicate entries
    table.unique(['profile_id', 'route_id'])

    // Indexes
    table.index('profile_id')
    table.index('route_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('profile_routes')
}
