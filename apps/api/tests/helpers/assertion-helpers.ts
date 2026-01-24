import { expect } from 'vitest'
import type { z } from 'zod'

/**
 * Valida que uma resposta é um erro com os dados esperados
 * 
 * @example
 * expectError(response, 401, 'Unauthorized', 'Token inválido')
 * expectError(response, 404, 'Not Found')
 */
export function expectError(
  response: any,
  statusCode: number,
  error?: string,
  message?: string
): void {
  expect(response.statusCode).toBe(statusCode)
  
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  expect(body).toHaveProperty('statusCode', statusCode)
  expect(body).toHaveProperty('error')
  
  if (error) {
    expect(body.error).toBe(error)
  }
  
  if (message) {
    expect(body.message).toContain(message)
  }
}

/**
 * Valida que uma resposta contém um erro de validação do Zod
 * 
 * @example
 * expectValidationError(response, 'email', 'Invalid email')
 */
export function expectValidationError(
  response: any,
  field?: string,
  message?: string
): void {
  expect(response.statusCode).toBe(400)
  
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  expect(body).toHaveProperty('statusCode', 400)
  expect(body).toHaveProperty('error', 'Validation Error')
  expect(body).toHaveProperty('message')
  
  if (field) {
    expect(body.message).toContain(field)
  }
  
  if (message) {
    expect(body.message).toContain(message)
  }
}

/**
 * Valida que uma resposta está OK (2xx)
 * 
 * @example
 * expectSuccess(response)
 * expectSuccess(response, 201)
 */
export function expectSuccess(
  response: any,
  statusCode: number = 200
): void {
  expect(response.statusCode).toBe(statusCode)
  
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  expect(body).toBeDefined()
  expect(body).not.toHaveProperty('error')
}

/**
 * Valida que uma resposta corresponde a um schema Zod
 * 
 * @example
 * const UserSchema = z.object({
 *   id: z.number(),
 *   email: z.string().email(),
 * })
 * 
 * assertResponseSchema(response, UserSchema)
 */
export function assertResponseSchema<T extends z.ZodTypeAny>(
  response: any,
  schema: T,
  options: {
    statusCode?: number
    strict?: boolean
  } = {}
): z.infer<T> {
  const { statusCode = 200 } = options
  
  // Validar status code
  expect(response.statusCode).toBe(statusCode)
  
  // Parse body
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  // Validar com Zod
  const result = schema.safeParse(body)
  
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    
    throw new Error(
      `Response schema validation failed:\n${errorMessage}\n\nReceived:\n${JSON.stringify(body, null, 2)}`
    )
  }
  
  return result.data
}

/**
 * Valida que uma resposta contém dados paginados
 * 
 * @example
 * expectPaginatedResponse(response, {
 *   minItems: 1,
 *   page: 1,
 *   limit: 10
 * })
 */
export function expectPaginatedResponse(
  response: any,
  options: {
    statusCode?: number
    minItems?: number
    maxItems?: number
    page?: number
    limit?: number
  } = {}
): void {
  const { 
    statusCode = 200, 
    minItems,
    maxItems,
    page,
    limit 
  } = options
  
  expect(response.statusCode).toBe(statusCode)
  
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  // Validar estrutura de paginação
  expect(body).toHaveProperty('data')
  expect(body).toHaveProperty('pagination')
  expect(Array.isArray(body.data)).toBe(true)
  
  const { pagination } = body
  expect(pagination).toHaveProperty('page')
  expect(pagination).toHaveProperty('limit')
  expect(pagination).toHaveProperty('total')
  expect(pagination).toHaveProperty('totalPages')
  
  // Validar valores específicos se fornecidos
  if (minItems !== undefined) {
    expect(body.data.length).toBeGreaterThanOrEqual(minItems)
  }
  
  if (maxItems !== undefined) {
    expect(body.data.length).toBeLessThanOrEqual(maxItems)
  }
  
  if (page !== undefined) {
    expect(pagination.page).toBe(page)
  }
  
  if (limit !== undefined) {
    expect(pagination.limit).toBe(limit)
  }
}

/**
 * Valida que uma resposta contém uma propriedade específica
 * 
 * @example
 * expectProperty(response, 'data.user.email', 'test@example.com')
 */
export function expectProperty(
  response: any,
  path: string,
  value?: any
): void {
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  const keys = path.split('.')
  let current = body
  
  for (const key of keys) {
    expect(current).toHaveProperty(key)
    current = current[key]
  }
  
  if (value !== undefined) {
    expect(current).toEqual(value)
  }
}

/**
 * Valida que uma resposta contém um array com itens que correspondem a um schema
 * 
 * @example
 * assertArrayResponse(response, UserSchema, { minItems: 1 })
 */
export function assertArrayResponse<T extends z.ZodTypeAny>(
  response: any,
  itemSchema: T,
  options: {
    statusCode?: number
    minItems?: number
    maxItems?: number
  } = {}
): z.infer<T>[] {
  const { statusCode = 200, minItems, maxItems } = options
  
  expect(response.statusCode).toBe(statusCode)
  
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  expect(Array.isArray(body)).toBe(true)
  
  if (minItems !== undefined) {
    expect(body.length).toBeGreaterThanOrEqual(minItems)
  }
  
  if (maxItems !== undefined) {
    expect(body.length).toBeLessThanOrEqual(maxItems)
  }
  
  // Validar cada item
  const validatedItems: z.infer<T>[] = []
  
  for (let i = 0; i < body.length; i++) {
    const result = itemSchema.safeParse(body[i])
    
    if (!result.success) {
      const errorMessage = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      
      throw new Error(
        `Item at index ${i} failed schema validation:\n${errorMessage}\n\nReceived:\n${JSON.stringify(body[i], null, 2)}`
      )
    }
    
    validatedItems.push(result.data)
  }
  
  return validatedItems
}

/**
 * Valida que uma resposta de criação está correta (201 Created com Location header)
 * 
 * @example
 * expectCreated(response, '/api/users/')
 */
export function expectCreated(
  response: any,
  locationPattern?: string | RegExp
): void {
  expect(response.statusCode).toBe(201)
  
  if (locationPattern) {
    expect(response.headers).toHaveProperty('location')
    
    if (typeof locationPattern === 'string') {
      expect(response.headers.location).toContain(locationPattern)
    } else {
      expect(response.headers.location).toMatch(locationPattern)
    }
  }
}

/**
 * Valida que uma resposta de deleção está correta (204 No Content)
 * 
 * @example
 * expectDeleted(response)
 */
export function expectDeleted(response: any): void {
  expect(response.statusCode).toBe(204)
  expect(response.body).toEqual('')
}

/**
 * Valida que uma resposta não contém campos sensíveis
 * 
 * @example
 * expectNoSensitiveData(response, ['password', 'token', 'secret'])
 */
export function expectNoSensitiveData(
  response: any,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'api_key']
): void {
  const body = typeof response.body === 'string' 
    ? JSON.parse(response.body) 
    : response.body
  
  const checkObject = (obj: any, path: string = '') => {
    if (typeof obj !== 'object' || obj === null) {
      return
    }
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        checkObject(item, `${path}[${index}]`)
      })
      return
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      // Verificar se a chave é sensível
      if (sensitiveFields.includes(key)) {
        throw new Error(
          `Sensitive field "${currentPath}" found in response with value: ${JSON.stringify(value)}`
        )
      }
      
      // Recursivo para objetos aninhados
      if (typeof value === 'object' && value !== null) {
        checkObject(value, currentPath)
      }
    }
  }
  
  checkObject(body)
}
