# Contratos DTO / API — CircularGuajira (Semana 04)
## Definición de Endpoints e Interfaces JSON del Backend

Este documento detalla la especificación de los contratos de la API para **CircularGuajira**, estructurando las solicitudes, respuestas y esquemas de error de cada endpoint. Todos los endpoints de negocio requieren autenticación mediante un token JWT enviado en las cabeceras de autorización (`Authorization: Bearer <JWT_TOKEN>`), y están protegidos por el interceptor global de roles RBAC [20, 56].

---

### 1. Resumen de Endpoints por Módulo

| Módulo (features/business/...) | Operación | Método y Ruta HTTP | Rol Requerido | Tipo de Payload |
| :--- | :--- | :--- | :--- | :--- |
| **Infraestructura** | Prueba de Salud | `GET /api/health` | Público | Ninguno |
| **Autenticación** | Inicio de Sesión | `POST /api/auth/login` | Público | `LoginDto` |
| **Autenticación** | Perfil de Usuario | `GET /api/auth/me` | Autenticado | Ninguno |
| **Collectors** | Crear Recolección | `POST /api/recolecciones` | `LOGISTICA` | `CreateRecoleccionDto` |
| **Weighing (Rebanada)** | Registrar Pesaje y Liquidar | `POST /api/weighing` | `BASCULA` | `CreateWeighingDto` |
| **Materials** | Consultar Tarifa Vigente | `GET /api/materials/:id/tarifa-vigente` | `BASCULA`, `FINANZAS`, `PLANTA` | Ninguno |
| **Plant** | Crear Lote Material | `POST /api/lotes-material` | `PLANTA` | `CreateLoteMaterialDto` |
| **Plant** | Asociar Pesaje a Lote | `PATCH /api/pesajes/:id/lote` | `PLANTA` | `AsociarLoteDto` |
| **Plant** | Registrar Venta de Lote | `POST /api/ventas-material` | `PLANTA` | `CreateVentaMaterialDto` |
| **Settlements** | Registrar Liquidación Manual | `POST /api/liquidaciones` | `FINANZAS` | `CreateLiquidacionDto` |

---

### 2. Especificación de Contratos

#### A. Módulo de Infraestructura (Público)

##### `GET /api/health`
*   **Descripción:** Verifica el estado general del sistema y, de forma no bloqueante, la conectividad con el motor de base de datos dockerizado [14, 24]. Si el motor no está configurado o no responde, el endpoint igual responde `200 OK` reportando `database.status` como `not_configured` o `disconnected` (nunca provoca un 500).
*   **Cabeceras:** Ninguna.
*   **Respuesta Exitosa (200 OK):**
```json
{
  "status": "ok",
  "uptime": 12.345,
  "timestamp": "2026-09-03T18:19:16Z",
  "database": {
    "status": "connected",
    "dialect": "postgres"
  }
}
```

---

#### B. Módulo de Autenticación (`features/auth`)

##### `POST /api/auth/login`
*   **Descripción:** Valida las credenciales del usuario y emite un par de tokens para el control seguro de la sesión [53].
*   **Cabeceras:** `Content-Type: application/json`
*   **Cuerpo de la Petición (`LoginDto`):**
```json
{
  "username": "operador_bascula",
  "password": "PasswordSegura123!"
}
```
*   **Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Autenticación exitosa",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTk5ODgyMiIsInVzZXJuYW1lIjoib3BlcmFkb3JfYmFzY3VsYSIsInJvbGVzIjpbIkJBU0NVTEEiXSwiaWF0IjoxNzEzNTI0NDAwLCJleHAiOjE3MTM1MjUzMDB9.xyz...",
    "refreshToken": "df873a21b3334c9c8de20188bca87930",
    "user": {
      "id": "u-998822",
      "username": "operador_bascula",
      "roles": ["BASCULA"]
    }
  }
}
```
*   **Respuesta de Error por Credenciales Inválidas (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Credenciales incorrectas o usuario inactivo"
}
```

##### `GET /api/auth/me`
*   **Descripción:** Retorna los datos detallados del usuario autenticado actual sin exponer contraseñas ni hashes [50].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "u-998822",
    "username": "operador_bascula",
    "email": "bascula@circularguajira.org",
    "isActive": true,
    "roles": ["BASCULA"],
    "createdAt": "2026-09-02T10:00:00Z"
  }
}
```

---

#### C. Módulo de Collectors (`features/business/collectors`)

##### `POST /api/recolecciones`
*   **Descripción:** Crea un evento de recolección en ruta para un reciclador específico [116].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `LOGISTICA` u `ADMIN` [112].
*   **Cuerpo de la Petición (`CreateRecoleccionDto`):**
```json
{
  "ruta_id": "8a7b3c2d-1122-3344-5566-778899aabbcc",
  "reciclador_id": "1a2b3c4d-5566-7788-9900-aabbccddeeff",
  "vehiculo_placa": "WOG-123",
  "conductor_nombre": "Jorge Epieyu",
  "fecha": "2026-09-03"
}
```
*   **Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Recolección registrada exitosamente",
  "data": {
    "id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
    "ruta_id": "8a7b3c2d-1122-3344-5566-778899aabbcc",
    "reciclador_id": "1a2b3c4d-5566-7788-9900-aabbccddeeff",
    "vehiculo_placa": "WOG-123",
    "conductor_nombre": "Jorge Epieyu",
    "fecha": "2026-09-03",
    "estado": "PROGRAMADA",
    "is_active": true,
    "created_at": "2026-09-03T18:19:16.000Z",
    "updated_at": "2026-09-03T18:19:16.000Z"
  }
}
```
*   **Respuesta de Error por ID Inexistente (404 Not Found):**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "La ruta asignada o el reciclador especificado no existen"
}
```

---

#### D. Módulo de Weighing (Rebanada Transaccional) (`features/business/weighing`)

##### `POST /api/weighing`
*   **Descripción:** Registra el pesaje de báscula, asocia la tarifa vigente del material, incrementa el stock de lote en planta y genera la liquidación correspondiente para el reciclador. Todo este flujo se ejecuta dentro de un bloque de transacción atómica de Sequelize [2, 13, 45].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `BASCULA` u `ADMIN` [112].
*   **Cuerpo de la Petición (`CreateWeighingDto`):**
```json
{
  "recoleccion_id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
  "material_id": "c1d2e3f4-5566-7788-9900-112233445566",
  "peso_bruto": 250.75,
  "tara": 15.25
}
```
*   **Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Pesaje transaccional completado con éxito",
  "data": {
    "pesaje": {
      "id": "bb99aa88-7766-5544-3322-1100fefe1122",
      "recoleccion_id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
      "material_id": "c1d2e3f4-5566-7788-9900-112233445566",
      "peso_bruto": 250.75,
      "tara": 15.25,
      "peso_neto": 235.50,
      "tarifa_material_id": "ff88ee77-6655-4433-2211-001122334455",
      "monto": 282600.00,
      "lote_material_id": "ee55dd44-cc33-bb22-aa11-002233445566",
      "created_at": "2026-09-03T18:19:16.000Z"
    },
    "lote_actualizado": {
      "id": "ee55dd44-cc33-bb22-aa11-002233445566",
      "cantidad_acumulada_kg": 1435.50
    },
    "liquidacion": {
      "id": "aa11bb22-cc33-dd44-ee55-ff6677889900",
      "recoleccion_id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
      "valor_total": 282600.00,
      "estado": "EMITIDA"
    }
  }
}
```
*   **Respuesta de Error por Invariante de Peso Inválido (400 Bad Request - INV-01):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "La tara no puede ser mayor o igual al peso bruto",
    "El peso neto resultante debe ser estrictamente mayor a cero"
  ]
}
```
*   **Respuesta de Error por Ausencia de Tarifa Activa (409 Conflict - INV-02):**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "No se puede registrar el pesaje: No existe una tarifa de material activa para la fecha actual"
}
```

---

#### E. Módulo de Materials (`features/business/materials`)

##### `GET /api/materials/:id/tarifa-vigente`
*   **Descripción:** Obtiene la tarifa unitaria activa y el identificador de tarifa para un material en la fecha de la consulta [4, 116].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `BASCULA`, `FINANZAS`, `PLANTA` u `ADMIN` [112].
*   **Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "material_id": "c1d2e3f4-5566-7788-9900-112233445566",
    "tarifa_material_id": "ff88ee77-6655-4433-2211-001122334455",
    "precio_por_kg": 1200.00,
    "fecha_inicio": "2026-08-01",
    "fecha_fin": null,
    "is_active": true
  }
}
```
*   **Respuesta de Error por Tarifa Inexistente (404 Not Found):**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "El material no tiene una tarifa configurada o activa para la fecha de consulta"
}
```

---

#### F. Módulo de Plant (`features/business/plant`)

##### `POST /api/lotes-material`
*   **Descripción:** Registra un nuevo lote de almacenamiento físico para un tipo de material en una planta [116].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `PLANTA` u `ADMIN` [112].
*   **Cuerpo de la Petición (`CreateLoteMaterialDto`):**
```json
{
  "planta_id": "7f8e9d0c-1122-3344-5566-778899aabbcc",
  "material_id": "c1d2e3f4-5566-7788-9900-112233445566"
}
```
*   **Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Lote físico de almacenamiento creado",
  "data": {
    "id": "ee55dd44-cc33-bb22-aa11-002233445566",
    "planta_id": "7f8e9d0c-1122-3344-5566-778899aabbcc",
    "material_id": "c1d2e3f4-5566-7788-9900-112233445566",
    "cantidad_acumulada_kg": 0.00,
    "is_active": true,
    "created_at": "2026-09-03T18:19:16.000Z"
  }
}
```

##### `PATCH /api/pesajes/:id/lote`
*   **Descripción:** Permite clasificar de forma manual un pesaje asignándole el lote correspondiente de planta (usado cuando el pesaje nace huérfano de lote en la báscula) [5, 113].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `PLANTA` u `ADMIN` [112].
*   **Cuerpo de la Petición (`AsociarLoteDto`):**
```json
{
  "lote_material_id": "ee55dd44-cc33-bb22-aa11-002233445566"
}
```
*   **Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Pesaje clasificado y stock de lote incrementado con éxito",
  "data": {
    "id": "bb99aa88-7766-5544-3322-1100fefe1122",
    "lote_material_id": "ee55dd44-cc33-bb22-aa11-002233445566",
    "peso_neto": 235.50,
    "lote_material_actualizado": {
      "id": "ee55dd44-cc33-bb22-aa11-002233445566",
      "cantidad_acumulada_kg": 1671.00
    }
  }
}
```
*   **Respuesta de Error por Pesaje Ya Clasificado (409 Conflict):**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "El pesaje ya se encuentra asignado y consolidado en un lote de material"
}
```

##### `POST /api/ventas-material`
*   **Descripción:** Registra la salida comercial de un lote de material hacia una industria transformadora externa, validando stock disponible para evitar sobregiros [6, 116].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `PLANTA` u `ADMIN` [112].
*   **Cuerpo de la Petición (`CreateVentaMaterialDto`):**
```json
{
  "lote_material_id": "ee55dd44-cc33-bb22-aa11-002233445566",
  "peso_comercializado": 500.00,
  "precio_venta_total": 750000.00
}
```
*   **Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Venta y despacho de lote registrado con éxito",
  "data": {
    "id": "9a8b7c6d-5566-7788-9900-aabbccddeeff",
    "lote_material_id": "ee55dd44-cc33-bb22-aa11-002233445566",
    "peso_comercializado": 500.00,
    "precio_venta_total": 750000.00,
    "fecha_venta": "2026-09-03T18:19:16.000Z",
    "lote_material_actualizado": {
      "id": "ee55dd44-cc33-bb22-aa11-002233445566",
      "cantidad_acumulada_kg": 1171.00
    }
  }
}
```
*   **Respuesta de Error por Stock Insuficiente (400 Bad Request - INV-07):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "No se puede procesar el despacho: El peso comercializado solicitado (500.00 kg) supera el stock disponible en el lote (235.50 kg)"
}
```

---

#### G. Módulo de Settlements (`features/business/settlements`)

##### `POST /api/liquidaciones`
*   **Descripción:** Genera o regenera manualmente la liquidación consolidada para todos los pesajes de una recolección que no posean una liquidación activa, aplicando transaccionalidad atómica para evitar duplicaciones [7, 116].
*   **Cabeceras:** `Authorization: Bearer <JWT_TOKEN>`
*   **Rol Requerido:** `FINANZAS` u `ADMIN` [112].
*   **Cuerpo de la Petición (`CreateLiquidacionDto`):**
```json
{
  "recoleccion_id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
  "observaciones": "Liquidación complementaria generada por revisión manual"
}
```
*   **Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Liquidación consolidada calculada y emitida con éxito",
  "data": {
    "id": "aa11bb22-cc33-dd44-ee55-ff6677889900",
    "recoleccion_id": "5f6e7d8c-9900-aabb-ccdd-eeff00112233",
    "reciclador_id": "1a2b3c4d-5566-7788-9900-aabbccddeeff",
    "fecha": "2026-09-03T18:19:16.000Z",
    "valor_total": 282600.00,
    "estado": "EMITIDA",
    "observaciones": "Liquidación complementaria generada por revisión manual"
  }
}
```
*   **Respuesta de Error por Liquidación Existente (409 Conflict):**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "La recolección ya cuenta con una liquidación generada y consolidada"
}
```

---

### 3. Respuestas de Error Comunes y Consistencia

Para garantizar la homogeneidad en las respuestas del servidor ante fallos de control de accesos o validación, se adoptan los siguientes formatos consistentes de NestJS [33]:

#### Error 401 Unauthorized (Falta de Token o Token Inválido) [12]
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "No se proporcionó un token de acceso válido"
}
```

#### Error 403 Forbidden (Rol no autorizado para el recurso) [12]
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Su rol de usuario no cuenta con los privilegios requeridos para acceder a este recurso"
}
```

#### Error 400 Bad Request (Fallo en Validación de Esquema con class-validator) [26]
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "peso_bruto debe ser un número decimal positivo",
    "tara es obligatoria y debe ser un número decimal"
  ]
}
```
