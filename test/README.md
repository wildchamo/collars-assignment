# Testing Strategy

Este proyecto utiliza **Vitest** con el pool de workers de Cloudflare para realizar pruebas unitarias e integración optimizadas para el entorno de Cloudflare Workers.

## 🏗️ Estructura de Tests

```
test/
├── unit/                    # Tests unitarios
│   ├── utils/              # Tests para funciones utilitarias
│   ├── middlewares/        # Tests para middlewares
│   └── handlers/           # Tests para handlers de dominio
├── integration/            # Tests de integración end-to-end
├── mocks/                  # Mocks y utilidades de test
│   └── cloudflare.mock.ts  # Mocks para APIs de Cloudflare
└── setup/                  # Configuración global de tests
```

## 🧪 Tipos de Tests

### 1. Tests Unitarios (`test/unit/`)

**Características:**

- Aislados y rápidos
- Mockan dependencias externas
- Prueban lógica específica de cada función/módulo

**Ejemplos:**

- ✅ Response utilities (`response.utils.test.ts`)
- ✅ Validation functions (`validation.utils.test.ts`)
- ✅ Middlewares (`rate-limit.middleware.test.ts`)
- ✅ Handler logic (`auth.handlers.test.ts`)

### 2. Tests de Integración (`test/integration/`)

**Características:**

- Prueban flujos completos de API
- Usan el entorno real de Cloudflare Workers
- Validan interacciones entre componentes

**Ejemplos:**

- ✅ Flujo completo de autenticación
- ✅ CRUD operations de tasks
- ✅ Rate limiting en endpoints reales

## 🛠️ Configuración

### Vitest + Cloudflare Workers

```typescript
// vitest.config.mts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
```

### Mocks Centralizados

```typescript
// test/mocks/cloudflare.mock.ts
export const createMockEnv = (): Env => ({
  DB: createMockDB(),
  JWT_TOKEN: 'test-jwt-secret',
  FREE_USER_RATE_LIMITER: createMockRateLimiter(),
  LOGGED_USER_RATE_LIMITER: createMockRateLimiter(),
});
```

## 🚀 Comandos de Test

```bash
# Ejecutar todos los tests
npm test

# Tests unitarios solamente
npm run test:unit

# Tests de integración solamente
npm run test:integration

# Watch mode para desarrollo
npm run test:watch

# Coverage report
npm run test:coverage

# UI interactiva
npm run test:ui
```

## 📋 Patrones de Testing

### 1. Testing de Middlewares

```typescript
describe('Rate Limit Middleware', () => {
  it('should use FREE_USER_RATE_LIMITER for unauthenticated users', async () => {
    const request = createMockRequest('https://example.com/api/tasks');
    mockEnv.FREE_USER_RATE_LIMITER.limit = vi.fn().mockResolvedValue({ success: true });

    await rateLimit(request, mockEnv, mockContext);

    expect(mockEnv.FREE_USER_RATE_LIMITER.limit).toHaveBeenCalledWith('/api/tasks-free-user');
  });
});
```

### 2. Testing de Handlers

```typescript
describe('loginHandler', () => {
  it('should login successfully with valid credentials', async () => {
    vi.mocked(isValidEmail).mockReturnValue(true);
    vi.mocked(userQueries.findByEmail).mockResolvedValue(mockUser);

    const response = await loginHandler(request, mockEnv);

    expect(response.status).toBe(200);
    expect(generateJWT).toHaveBeenCalledWith(authUser, mockEnv.JWT_TOKEN, mockEnv.DB);
  });
});
```

### 3. Testing de Integración

```typescript
describe('API Integration Tests', () => {
  it('should create user and login successfully', async () => {
    const createUserResponse = await SELF.fetch('https://example.com/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    expect(createUserResponse.status).toBe(201);
  });
});
```

## 🎯 Cobertura de Tests

**Componentes cubiertos:**

- ✅ Response utilities (100%)
- ✅ Validation functions (100%)
- ✅ Rate limiting middleware (95%)
- ✅ Auth handlers (90%)
- ✅ Integration flows (80%)

**Por implementar:**

- [ ] Task handlers tests
- [ ] User handlers tests
- [ ] Assignment handlers tests
- [ ] Database utilities tests
- [ ] JWT utilities tests

## 🔧 Mocking Strategy

### 1. External Dependencies

- **Cloudflare D1**: Mock completo de prepared statements
- **JWT Utils**: Mock de generación/verificación de tokens
- **Rate Limiters**: Mock de límites de frecuencia

### 2. Request/Response

- **IRequest**: Factory function con propiedades de itty-router
- **Environment**: Mock del env de Cloudflare Workers
- **Context**: Mock del execution context

## 📊 Best Practices

1. **Isolación**: Cada test debe ser independiente
2. **Descriptivos**: Nombres de test claros y específicos
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mocking**: Mock solo lo necesario, no sobre-mockear
5. **Cleanup**: `beforeEach` para limpiar mocks
6. **Async/Await**: Manejo correcto de promesas
7. **Error Cases**: Test tanto casos exitosos como de error

## 🐛 Debugging

```bash
# Ejecutar test específico
npm test -- rate-limit

# Modo debug con logs
npm test -- --reporter=verbose

# Ejecutar un solo test file
npm test test/unit/utils/response.utils.test.ts
```

---

Este setup te permite tener confianza en el código, detectar regresiones temprano y mantener la calidad del proyecto a medida que crece. 🚀
