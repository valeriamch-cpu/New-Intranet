# New-Intranet

Intranet HTML5 con acceso por usuario y permisos por módulo/área.

## Incluye

- Login con usuario/clave.
- Permisos por usuario para módulos y carpetas.
- Interfaz fluida para celular (Android/iOS).
- Página principal con:
  - Pizarra de notas.
  - Calendario de eventos compartidos.
  - Link de Rinde gastos a una vista separada y restringida por permisos.
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

## Rinde gastos

Formato actual:

1. Número rendición
2. Nombre
3. Gasto
4. Monto
5. Foto

El guardado directo en Drive está preparado vía webhook en `script.js` (`DRIVE_UPLOAD_WEBHOOK`).
Si no hay webhook configurado, la app descarga un JSON para subir manualmente.
