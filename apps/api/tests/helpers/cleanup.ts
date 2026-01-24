import { db } from '@/lib/db'

/**
 * Helper simples para deletar registros após testes
 * 
 * @param table - Nome da tabela
 * @param ids - Array de IDs a serem deletados
 * 
 * @example
 * const userId = await insertUser()
 * const tenantId = await insertTenant()
 * 
 * // No final do teste
 * await deleteRecords('users', [userId])
 * await deleteRecords('tenants', [tenantId])
 */
export async function deleteRecords(
  table: string, 
  ids: number[]
): Promise<void> {
  if (ids.length === 0) return
  
  await db(table).whereIn('id', ids).delete()
}

/**
 * Helper para deletar múltiplas tabelas de uma vez
 * 
 * @example
 * await deleteMultiple([
 *   { table: 'users', ids: [userId] },
 *   { table: 'tenants', ids: [tenantId] }
 * ])
 */
export async function deleteMultiple(
  records: Array<{ table: string; ids: number[] }>
): Promise<void> {
  for (const { table, ids } of records) {
    await deleteRecords(table, ids)
  }
}

/**
 * Limpa registros de usuário e suas relações (tenant_users)
 */
export async function cleanupUsers(userIds: number[]): Promise<void> {
  if (userIds.length === 0) return
  
  // Deletar relações primeiro
  await db('tenant_users').whereIn('user_id', userIds).delete()
  await db('user_profiles').whereIn('user_id', userIds).delete()
  
  // Deletar usuários
  await db('users').whereIn('id', userIds).delete()
}

/**
 * Limpa registros de tenant e suas relações
 */
export async function cleanupTenants(tenantIds: number[]): Promise<void> {
  if (tenantIds.length === 0) return
  
  // Deletar relações primeiro
  await db('tenant_users').whereIn('tenant_id', tenantIds).delete()
  
  // Deletar tenants
  await db('tenants').whereIn('id', tenantIds).delete()
}
