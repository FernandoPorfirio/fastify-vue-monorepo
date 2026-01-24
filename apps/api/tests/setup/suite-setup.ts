import { config } from 'dotenv'
import { resolve } from 'node:path'

/**
 * Suite Setup: configuração básica de ambiente
 * Executado uma vez antes de todos os testes
 */

// Carregar variáveis de ambiente do .env.test
config({ path: resolve(__dirname, '../../.env.test') })

// Garantir que estamos em ambiente de teste
process.env.NODE_ENV = 'test'
