import type { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('profiles').del()

  // Inserts seed entries
  await knex('profiles').insert([
    {
      id: 1,
      name: 'admin',
      description: 'Administrador com acesso completo ao sistema',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'user',
      description: 'Usuário padrão com acesso básico',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ])
}
