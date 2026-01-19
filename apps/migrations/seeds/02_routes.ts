import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("routes").del();

  // Inserts seed entries
  await knex("routes").insert([
    {
      id: 1,
      name: "api_docs",
      path: "/api-docs",
      type: "frontend",
      method: null,
      description: "Documentação da API",
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: "health_check",
      path: "/health",
      type: "api",
      method: "GET",
      description: "Health check endpoint",
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
}
