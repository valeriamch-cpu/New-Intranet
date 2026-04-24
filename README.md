# New-Intranet

Intranet HTML5 con acceso por usuario y permisos por módulo/área.

## Incluye

- Login con usuario/clave.
- Permisos por usuario para módulos y carpetas.
- Página principal con:
  - Pizarra de notas.
  - Calendario de eventos compartidos.
  - Rinde gastos (nombre, monto, detalle y foto), con guardado de borrador y cierre por N° de rendición.
- 4 carpetas con links directos a Drive:
  - Wholesale
  - Marketing
  - Finanzas
  - Operaciones

## Usuarios demo

- `valeria` / `1234` → acceso total.
- `veronica` / `4567` → acceso restringido (solo Operaciones y módulos básicos).
- `admin` / `admin123` → acceso total.

## Ejecutar en local

```bash
python3 -m http.server 8080
```

Abrir: `http://localhost:8080`

## Flujo de rendición de gastos

1. Carga gastos uno a uno con nombre, monto, detalle y foto.
2. Usa **Guardar borrador** para consolidar muchos gastos.
3. Haz clic en **Finalizar rendición** e ingresa:
   - Número de rendición.
   - Nombre del responsable.
4. Se descarga un JSON con nombre `<numero> - <nombre>.json`.
5. En Drive, crea la carpeta con ese mismo nombre y sube JSON + fotos.
