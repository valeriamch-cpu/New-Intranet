# New-Intranet

Prototipo de intranet web con:

- Pantalla de acceso (login + vista previa).
- Panel con calendario grupal.
- Pizarra de notas compartida.
- Chat grupal.
- Persistencia en navegador con `localStorage`.

## Verlo en local

```bash
python3 -m http.server 8080
```

Luego abrir: `http://localhost:8080`

Flujo de páginas:
- `index.html` = acceso.
- `dashboard.html` = calendario + pizarra + chat.

## Publicación en GitHub Pages

URL esperada del proyecto:

- https://valeriamch-cpu.github.io/New-Intranet/

## Personalización rápida

- Cambia los links de áreas (`Wholesale`, `Finanzas`, `Marketing`, `Operaciones`) en `index.html` para apuntar a carpetas reales de Drive.
- Ajusta usuarios/clave demo en `script.js` dentro de la constante `users`.
- Limpia datos de demo en el navegador borrando `localStorage` del sitio.

## Error común: “No permite actualizar porque fue por fuera”

Si GitHub/Git te indica que no puedes actualizar porque el branch cambió “por fuera”, significa que hay commits remotos que no tienes localmente.

Pasos recomendados:

```bash
git fetch origin
git pull --rebase origin <tu-rama>
```

Si hay conflictos:

```bash
git status
# editar archivos con conflicto
git add <archivo>
git rebase --continue
```

Luego:

```bash
git push origin <tu-rama>
```

Si prefieres evitar rebase:

```bash
git pull origin <tu-rama>
git push origin <tu-rama>
```

## ¿En qué parte escribo esos comandos? (paso a paso, nivel cero)

No te preocupes, es normal. Haz esto:

1. Abre **GitHub Desktop** o una **terminal** (CMD / PowerShell / Terminal de VS Code).
2. Entra a la carpeta del proyecto (`New-Intranet`).
3. Copia y pega los comandos **uno por uno** y presiona Enter.

Si usas VS Code:

1. Abre la carpeta `New-Intranet`.
2. Menú **Terminal > New Terminal**.
3. Verifica que la ruta termine en `New-Intranet`.
4. Ejecuta:

```bash
git fetch origin
git pull --rebase origin <tu-rama>
git push origin <tu-rama>
```

Si no sabes tu rama, ejecuta:

```bash
git branch --show-current
```

Ese nombre reemplaza `<tu-rama>`.
