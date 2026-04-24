# New-Intranet

Intranet HTML5 con acceso por usuario y permisos por módulo/área.

## Incluye

- Login con usuario/clave.
- Permisos por usuario para módulos y carpetas.
- Página principal con:
  - Pizarra de notas.
  - Calendario de eventos compartidos.
  - Rinde gastos (nombre, monto, detalle y foto).
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
