# Tablero Colaborativo (Spring Boot + p5.js)

Aplicación de ejemplo para un tablero de dibujo colaborativo sencillo usando:

- Backend: Spring Boot 3.5.6 (REST + estado en memoria)
- Frontend: p5.js (polling cada 1s) + JS vanilla

## Funcionalidades

- Múltiples usuarios pueden dibujar simultáneamente (cada request de dibujo se agrega a un estado compartido en memoria)
- Color aleatorio inicial para cada cliente (`/api/randomColor`)
- Botón para limpiar el tablero (afecta a todos) `/api/clear`
- Polling cada 1 segundo a `/api/board`
- Dibujo optimista local (se ve instantáneo antes de la respuesta)

## Endpoints

| Método | Endpoint            | Descripción                          |
|--------|---------------------|--------------------------------------|
| GET    | /api/board          | Lista completa de acciones actuales  |
| POST   | /api/draw           | Agrega una acción (x,y,color,clear)  |
| POST   | /api/clear          | Limpia el tablero                    |
| GET    | /api/randomColor    | Devuelve un color aleatorio          |

`DrawingAction` JSON:

```json
{ "x": 123.4, "y": 88.2, "color": "#ff00aa", "clear": false }
```
Si `clear=true` se ignoran x,y,color y se limpia el estado.

## Ejecución

Requisitos: JDK 21 + Maven.

### Compilar y probar

```powershell
mvn clean test
```

### Ejecutar aplicación

```powershell
mvn spring-boot:run
```

Abrir en el navegador: <http://localhost:8080/>

## Estructura principal

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

## Notas

- Estado no está persistido: al reiniciar se pierde el tablero.
- Para producción real se recomienda WebSocket (STOMP) o Server-Sent Events en lugar de polling.
- El tamaño de la lista crecerá indefinidamente; se podría truncar o compactar (optimización futura).

## Mejoras Futuras Sugeridas

- Compresión y agrupado de puntos (stroke batching)
- WebSockets para baja latencia
- Persistencia en Redis o base de datos
- Control de usuarios / nombres / sesiones
- Límite de tamaño de historia y paginado

---
Proyecto académico de práctica ARSW.
