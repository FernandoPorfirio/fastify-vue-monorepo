import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("user_profiles").del();
  await knex("tenant_users").del();
  await knex("users").del();
  await knex("tenants").del();

  // Insert tenant
  const [tenant] = await knex("tenants")
    .insert({
      id: 1,
      name: "Default Tenant",
      slug: "default",
      domain: null,
      plan: "free",
      max_users: 5,
      owner_email: "admin@example.com",
      is_active: true,
      is_trial: false,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("id");

  // Insert admin user
  // NOTE: In production, use bcrypt/argon2 to hash passwords
  // Password: admin123 (this is just a placeholder, use proper hashing in production)
  const [user] = await knex("users")
    .insert({
      id: 1,
      email: "admin@example.com",
      password: "$2b$10$rKvVLZ8Z8Z8Z8Z8Z8Z8Z8u", // Placeholder - implement proper password hashing
      name: "Admin User",
      is_active: true,
      email_verified: true,
      email_verified_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("id");

  // Link user to tenant
  await knex("tenant_users").insert({
    tenant_id: tenant.id || 1,
    user_id: user.id || 1,
    is_active: true,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });

  // Link user to admin profile in tenant context
  await knex("user_profiles").insert({
    user_id: user.id || 1,
    profile_id: 1, // admin profile from 01_profiles seed
    tenant_id: tenant.id || 1,
    is_active: true,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
}
