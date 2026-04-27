# New-Intranet

Intranet HTML5 con acceso por usuario y permisos por módulo/área.

## Incluye

- Login con usuario/clave.
- Permisos por usuario para módulos y carpetas.
- Interfaz fluida para celular (Android/iOS) + modo instalable (PWA básica).
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

En celular puedes abrir el sitio y usar “Agregar a pantalla de inicio” para ejecutarlo como app web.

## Flujo de rendición de gastos

1. En el panel principal, entra por el link **Ir a Rinde gastos** (solo disponible para usuarios habilitados).
2. Primer gasto: completa **N° rendición + nombre + gasto + monto** y (opcional) foto desde celular.
3. Siguientes gastos: agrega **gasto + monto** y foto opcional.
4. Presiona **Finalizar** para guardar la rendición en una carpeta con nombre `<numero> - <nombre>`.
