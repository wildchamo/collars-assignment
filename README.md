# Task Management API - DDD Architecture

Este proyecto implementa una API de gestión de tareas usando **Domain-Driven Design (DDD)** con **Cloudflare Workers** e **itty-router**.

## 🏗️ Arquitectura DDD

La aplicación está organizada siguiendo los principios de DDD, separando la lógica de negocio en dominios específicos:

```
src/
├── index.ts                    # Router principal (Orchestrator)
├── shared/                     # Tipos y utilidades compartidas
│   └── types.ts
└── domains/                    # Dominios de negocio
    ├── tasks/                  # Dominio de Tareas
    │   ├── router.ts          # Rutas específicas de tareas
    │   └── handlers.ts        # Lógica de negocio de tareas
    ├── users/                  # Dominio de Usuarios
    │   ├── router.ts          # Rutas específicas de usuarios
    │   └── handlers.ts        # Lógica de negocio de usuarios
    └── assignments/            # Dominio de Asignaciones
        ├── router.ts          # Rutas de asignación de tareas
        └── handlers.ts        # Lógica de asignaciones
```

## 🎯 Principios DDD Aplicados

### 1. **Separación por Dominios**

- **Tasks Domain**: Gestión completa del ciclo de vida de tareas
- **Users Domain**: Gestión de usuarios
- **Assignments Domain**: Relación entre tareas y usuarios

### 2. **Separación de Responsabilidades**

- **Routers**: Manejan solo el enrutamiento HTTP
- **Handlers**: Contienen la lógica de negocio
- **Types**: Definen los contratos de datos

### 3. **Composición de Routers**

- El router principal (`index.ts`) orquesta los routers de dominio
- Cada dominio es independiente y reutilizable

## 📋 Endpoints Disponibles

### Task Management

- `GET /tasks` - Obtener todas las tareas
- `GET /tasks/:id` - Obtener tarea por ID
- `POST /tasks` - Crear nueva tarea
- `PUT /tasks/:id` - Actualizar tarea
- `DELETE /tasks/:id` - Eliminar tarea

### User Management

- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear nuevo usuario

### Task Assignment

- `POST /tasks/:id/assign` - Asignar tarea a usuario
- `GET /users/:id/tasks` - Obtener tareas asignadas a usuario

## 🚀 Cómo Extender

### Agregar Nuevo Dominio

1. Crear carpeta en `src/domains/nuevo-dominio/`
2. Crear `router.ts` y `handlers.ts`
3. Registrar el router en `src/index.ts`

### Agregar Nueva Funcionalidad a Dominio Existente

1. Agregar método en el Handler correspondiente
2. Registrar la ruta en el Router del dominio

## 🔧 Ventajas de esta Arquitectura

- **Escalabilidad**: Fácil agregar nuevos dominios
- **Mantenibilidad**: Código organizado por contexto de negocio
- **Testabilidad**: Handlers aislados fáciles de testear
- **Reutilización**: Dominios independientes reutilizables
- **Separación de Concerns**: Routing vs Business Logic

## 🛠️ Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Deploy
npm run deploy
```

## 📝 Próximos Pasos

- [ ] Implementar validación de esquemas (Zod)
- [ ] Agregar middleware de autenticación
- [ ] Implementar persistencia de datos (D1)
- [ ] Agregar tests unitarios por dominio
- [ ] Implementar logging estructurado
