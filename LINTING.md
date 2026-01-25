# Code Quality Tools

Este projeto usa ferramentas simples e modernas para manter a qualidade do código:

## 🛠️ Ferramentas Instaladas

### ESLint

Linter JavaScript/TypeScript para identificar e corrigir problemas no código.

**Comandos:**

```bash
# Verificar problemas
pnpm lint

# Corrigir automaticamente
pnpm lint:fix
```

### Prettier

Formatador de código automático para manter consistência.

**Comandos:**

```bash
# Formatar todos os arquivos
pnpm format

# Verificar se está formatado
pnpm format:check
```

### EditorConfig

Mantém configurações consistentes entre diferentes editores (VS Code, WebStorm, etc).

O arquivo `.editorconfig` já está configurado. Instale a extensão do EditorConfig no seu editor.

## 📋 Extensões Recomendadas para VS Code

Crie o arquivo `.vscode/extensions.json` com:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "editorconfig.editorconfig"
  ]
}
```

## ⚙️ Configuração do VS Code

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript"]
}
```

## 🔍 Regras Configuradas

### ESLint

- ⚠️ Avisos sobre uso de `any` (não bloqueia build)
- ⚠️ Variáveis não utilizadas (exceto com prefixo `_`)
- ❌ Erro em `var` (use `const` ou `let`)
- 🔒 Regras relaxadas em arquivos de teste

### Prettier

- Sem ponto-e-vírgula
- Aspas simples
- Trailing comma em ES5
- 100 caracteres por linha
- Indentação: 2 espaços

## 📝 Boas Práticas

1. **Antes de commitar:**

   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```

2. **Configure seu editor** para formatar ao salvar

3. **Use `eslint-disable` com moderação:**

   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const data: any = complexLibraryResponse
   ```

4. **Prefira `unknown` ao invés de `any` quando possível**

## 🚀 CI/CD (Futuro)

Você pode adicionar esses checks no CI:

```yaml
- run: pnpm install
- run: pnpm format:check
- run: pnpm lint
- run: pnpm test
```

## 📚 Documentação

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [EditorConfig](https://editorconfig.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)
