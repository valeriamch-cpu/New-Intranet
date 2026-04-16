# New-Intranet

Prototipo de intranet estática inspirado en su estructura de Google Sites:

- Navegación principal tipo portal (Página principal / Informes / Pedidos).
- Bloque de bienvenida.
- Resumen de reunión anterior en formato lista.
- Tarjetas de temas pendientes y fechas de importación.
- Calendario por equipo (Operaciones, Finanzas, Wholesale, Marketing y Gestión).
- Formulario para agregar eventos al equipo seleccionado.

## Verlo en local

```bash
python3 -m http.server 8080
```

Luego abrir: `http://localhost:8080`

## Publicación en GitHub Pages

URL esperada del proyecto:

- https://valeriamch-cpu.github.io/New-Intranet/

## Personalización rápida

- Edita `intranetContent` en `script.js` para cambiar resumen, pendientes e importaciones.
- Edita `teams` en `script.js` para ajustar eventos por área.
- Cambia links del header en `index.html` si necesitas apuntar a tus rutas internas reales.
