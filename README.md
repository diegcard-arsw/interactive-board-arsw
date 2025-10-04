# Tablero Colaborativo (Spring Boot + p5.js + WebSockets)

Aplicación de ejemplo para un tablero de dibujo colaborativo en tiempo (casi) real que mezcla **p5.js** para el renderizado y **Spring Boot** para exponer tanto una API REST como un canal WebSocket (STOMP sobre SockJS). Incluye fallback automático a polling HTTP cuando la conexión WebSocket no está disponible.

## 🎯 Objetivos del Proyecto

Demostrar un patrón sencillo para:

1. Compartir estado de dibujo en memoria entre múltiples clientes.
2. Difundir eventos de inmediato vía STOMP/WebSocket.
3. Mantener compatibilidad con clientes degradados (fallback a polling REST).

## 🧱 Tecnologías Principales

| Capa | Stack |
|------|-------|
| Backend | Spring Boot 3.5.6, Spring Web, Spring WebSocket (STOMP, SockJS) |
| Frontend | p5.js 1.11.x, SockJS client, stomp.js, JS vanilla |
| Build | Maven |
| Lenguaje | Java 21 |

## 🚀 Funcionalidades

- Dibujo colaborativo en tiempo real (emisión de cada punto por STOMP).
- Fallback automático a polling (`/api/board` cada 5s) si se pierde la conexión WS.
- Color inicial aleatorio por cliente (`/api/randomColor`).
- Botón de limpieza global (propaga mensaje `clear`).
- Dibujo optimista local (no espera round-trip para mostrar trazos propios).
- Indicador visual de estado de conexión (Conectado / Conectando / Desconectado).
- Redimensionado dinámico del canvas.

## 🧩 Arquitectura (Vista Simplificada)

```text
┌──────────────┐        STOMP / SockJS (/ws)        ┌────────────────────┐
│   Navegador  │  ─────────────────────────────────▶│  Spring Boot Broker │
│  p5.js + JS  │◀───────────────────────────────────┤  (SimpleBroker)     │
└──────┬───────┘                                    └─────────┬──────────┘
    │  REST (JSON)  /api/*                                 │
    ▼                                                      ▼
  Render Canvas                                   Servicio en Memoria
                       (DrawingBoardService)
```

## 🔄 Flujo de Dibujo

1. Usuario presiona mouse / touch y se genera acción `{x,y,color,clear:false}`.
2. Se envía por STOMP a `/app/draw` (o POST `/api/draw` si no hay WS).
3. El backend agrega acción a la lista en memoria y reenvía a `/topic/board`.
4. Cada cliente suscrito recibe la acción y dibuja el punto.

## 🧹 Flujo de Limpieza

1. Usuario hace clic en “Borrar”.
2. Se envía mensaje vacío a `/app/clear` (o POST `/api/clear` fallback).
3. Backend limpia la lista y publica a `/topic/clear`.
4. Clientes vacían su canvas y reinician estado local.

## 🌐 Endpoints REST (Fallback / Inicialización)

| Método | Endpoint         | Descripción                                 |
|--------|------------------|---------------------------------------------|
| GET    | /api/board       | Estado completo (todas las acciones)        |
| POST   | /api/draw        | Agrega una acción puntual                   |
| POST   | /api/clear       | Limpia el estado global                     |
| GET    | /api/randomColor | Devuelve un color aleatorio por petición     |

## 🔔 Destinos STOMP (Tiempo Real)

| Tipo | Destino            | Uso |
|------|--------------------|-----|
| Cliente → Servidor | /app/draw  | Enviar una acción de dibujo |
| Cliente → Servidor | /app/clear | Solicitar limpieza global   |
| Servidor → Cliente | /topic/board | Broadcast de cada acción de dibujo |
| Servidor → Cliente | /topic/clear | Notificación de limpieza |

### Formato Mensaje Dibujo (STOMP / JSON)

```json
{ "x": 123.4, "y": 88.2, "color": "#ff00aa", "clear": false }
```
Si `clear` es `true` (sólo al usar fallback REST) se interpreta como orden de limpieza.

## 🗂 Record / DTO

`DrawingAction` (Java `record`):

```java
public record DrawingAction(double x, double y, String color, boolean clear) {}
```

## ⚙️ Ejecución

Requisitos: **JDK 21** y **Maven** instalados.

### Compilar y probar

```powershell
mvn clean test
```

### Ejecutar aplicación

```powershell
mvn spring-boot:run
```

Luego abre en el navegador: <http://localhost:8080/>

Abre múltiples pestañas para observar la colaboración en tiempo real. El indicador de estado mostrará:

- Verde: conectado a WebSocket.
- Amarillo animado: conectando.
- Gris: en fallback (se usará polling cada 5s).

## 📁 Estructura principal

```text
src/main/java/com/example/board
  BoardApplication.java
  model/DrawingAction.java
  service/DrawingBoardService.java
  controller/DrawingController.java
src/main/resources/static
  index.html
  css/style.css
  js/sketch.js
```

## ℹ️ Notas

- Estado efímero en memoria: reiniciar borra el historial.
- SimpleBroker embebido (no requiere RabbitMQ / ActiveMQ para este demo).
- Fallback polling: sólo para resiliencia / clientes legacy.
- Lista de acciones crece indefinidamente: considerar consolidación (batching) o límite circular.

## 🛠️ Roadmap / Mejoras Futuras

- Agrupar puntos en “strokes” para reducir tráfico.
- WebSocket nativo sin SockJS cuando el soporte del navegador lo permita explícitamente.
- Persistencia (Redis / Postgres / S3 snapshot de imágenes).
- Compresión delta (sólo enviar últimos N puntos a nuevos clientes).
- Identidad de usuarios y nombres visibles.
- Limitador de tasa (rate limiting) por IP / sesión.
- Exportar imagen actual a PNG.
- Undo/Redo por usuario.

## 🧪 Estrategia de Pruebas (Actual y Propuesta)

Actualmente: test unitario de servicio (`DrawingBoardServiceTest`).

Proponer: pruebas de integración WebSocket usando `@SpringBootTest` + `WebSocketStompClient` y pruebas de performance midiendo latencia media por trazo.

## 🩺 Troubleshooting

| Síntoma | Posible Causa | Solución |
|---------|---------------|----------|
| Indicador siempre gris | Bloqueo WS (proxy / firewall) | Revisar consola DevTools; probar en otra red |
| Trazos tardan en aparecer | Fallback activo (sin WS) | Verificar endpoint `/ws` responde; revisar logs backend |
| Colores iguales | Cache navegador / fallo `/api/randomColor` | Forzar recarga o limpiar cache |
| Memoria alta tras mucho uso | Lista de acciones muy grande | Implementar truncado / snapshot periódico |

## 🔐 Consideraciones (No Implementadas)

- No hay autenticación ni aislamiento de salas.
- No se valida rango de coordenadas (se confía en el cliente).
- No hay protección contra flood (un cliente podría enviar muchos puntos).

## ⚖️ Licencia

Uso académico / educativo (añade una licencia formal si se publicará ampliamente: MIT / Apache-2.0 / GPL, etc.).

## 🤝 Contribuir

1. Haz un fork.
2. Crea una rama feature: `git checkout -b feature/nombre`.
3. Commit: `git commit -m "feat: añade X"`.
4. Push: `git push origin feature/nombre`.
5. Abre PR.

## 📌 Resumen Rápido

| Acción | Ruta / Destino | Tipo |
|--------|----------------|------|
| Obtener tablero | GET /api/board | REST |
| Dibujar punto | /app/draw | STOMP SEND |
| Limpiar tablero | /app/clear | STOMP SEND |
| Suscribirse a puntos | /topic/board | STOMP SUB |
| Suscribirse a limpieza | /topic/clear | STOMP SUB |
| Color aleatorio | GET /api/randomColor | REST |

---
Proyecto académico de práctica ARSW (versión extendida con WebSockets).
