import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tenants', table => {
    // Primary key
    table.increments('id').primary()

    // External reference
    table.uuid('external_reference').notNullable().unique().defaultTo(knex.raw('gen_random_uuid()'))

    // Tenant identification
    table.string('name', 255).notNullable()
    table.string('slug', 255).notNullable().unique()
    table.string('domain', 255).nullable().unique()

    // Subscription & Plan
    table
      .enum('plan', ['free', 'starter', 'professional', 'enterprise'])
      .notNullable()
      .defaultTo('free')
    table.timestamp('subscription_started_at').nullable()
    table.timestamp('subscription_expires_at').nullable()

    // Limits & Quotas
    table.integer('max_users').notNullable().defaultTo(5)

    // Contact & Settings
    table.string('owner_email', 255).notNullable()
    table.string('support_email', 255).nullable()
    table.string('phone', 50).nullable()
    table.jsonb('settings').nullable()

    // Billing information
    table.string('billing_name', 255).nullable()
    table.string('billing_document', 100).nullable()
    table.string('billing_address', 500).nullable()
    table.string('billing_city', 100).nullable()
    table.string('billing_state', 100).nullable()
    table.string('billing_postal_code', 20).nullable()
    table.string('billing_country', 2).nullable().defaultTo('BR')

    // Account status
    table.boolean('is_active').notNullable().defaultTo(true)
    table.boolean('is_trial').notNullable().defaultTo(true)

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('deleted_at').nullable()

    // Indexes
    table.index('domain')
    table.index('plan')
    table.index('is_active')
    table.index('subscription_expires_at')
    table.index('created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenants')
}
