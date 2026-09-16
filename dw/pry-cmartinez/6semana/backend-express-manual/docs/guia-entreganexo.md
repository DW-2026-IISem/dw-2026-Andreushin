### PROYECTO 03: EntregaNexo - Marketplace local de última milla
**Ámbito:** Marketplace / Logística / Pagos / Seguimiento

--------------------------------------------------------------------------------

#### 1. Narrativa del Proyecto
EntregaNexo conecta comercios locales, compradores y repartidores independientes. Cada pedido puede reunir productos de un comercio, cambiar de estado según hitos verificables y generar cobros, comisión de plataforma y liquidación al aliado. El sistema debe asignar repartidor por disponibilidad y zona, registrar el seguimiento y resolver cancelaciones sin inconsistencias financieras.

--------------------------------------------------------------------------------

#### 2. Entidades de Negocio
| Entidad de Dominio | Atributos / Claves Sugeridos |
| ------ | ------ |
| **Cliente** | id, tipo_documento, numero_documento (UQ), nombre, telefono, email, is_active |
| **Comercio** | id, nombre, descripcion, is_active, created_at, updated_at |
| **Producto** | id, sku (UQ), nombre, descripcion, precio, is_active |
| **Pedido** | id, cliente_id (FK), origen_id (FK), canal, fecha, subtotal, total, estado |
| **PedidoDetalle** | id, cabecera_id (FK), item_id (FK), cantidad, valor_unitario, total, observaciones |
| **Repartidor** | id, nombre, descripcion, is_active, created_at, updated_at |
| **Asignacion** | id, principal_id (FK), relacionado_id (FK), datos_relacion, is_active |
| **EventoTracking** | id, referencia_id (FK), tipo, fecha, cantidad, observaciones, estado |
| **Pago** | id, referencia_tipo, referencia_id, metodo, monto, fecha, estado |
| **Liquidacion** | id, referencia_id (FK), fecha, valor, estado, observaciones |

--------------------------------------------------------------------------------

#### 3. Relaciones de Negocio
* **Comercio** 1:N **Producto**
* **Comercio** 1:N **Pedido**
* **Cliente** 1:N **Pedido**
* **Pedido** 1:N **PedidoDetalle**
* **Producto** 1:N **PedidoDetalle**
* **Pedido** 1:N **Asignacion**
* **Repartidor** 1:N **Asignacion**
* **Pedido** 1:N **EventoTracking**
* **Pedido** 1:N **Pago**
* **Comercio** 1:N **Liquidacion** (Liquidacion agrupa pedidos conciliados)

--------------------------------------------------------------------------------

#### 4. Control de Acceso (RBAC) y Recursos de Referencia
##### Roles Iniciales
* ADMIN
* COMERCIO
* OPERADOR
* REPARTIDOR
* FINANZAS

##### Recursos de Referencia (Endpoints)
* POST /pedidos
* POST /asignaciones
* POST /tracking
* POST /liquidaciones

--------------------------------------------------------------------------------

#### 5. Módulos de Negocio Sugeridos
* features/business/merchants
* catalog
* orders
* dispatch
* tracking
* settlements
