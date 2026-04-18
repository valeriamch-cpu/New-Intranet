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

- Cambia los links de áreas en `dashboard.html` para apuntar a carpetas reales de Drive (`https://drive.google.com/drive/folders/<ID_CARPETA>`).
- Ajusta usuarios/clave demo en `script.js` dentro de la constante `users`.
- Limpia datos de demo en el navegador borrando `localStorage` del sitio.

### ¿Cómo me pasas los links de Drive?

Mándamelos aquí en este formato (copiar/pegar):

```text
Wholesale: https://drive.google.com/drive/folders/...
Finanzas: https://drive.google.com/drive/folders/...
Marketing: https://drive.google.com/drive/folders/...
Operaciones: https://drive.google.com/drive/folders/...
```

Si no quieres pasar el link completo, también sirve solo el ID de carpeta:

```text
Wholesale: 1abc...
Finanzas: 1def...
Marketing: 1ghi...
Operaciones: 1jkl...
```

## Acceso restringido por usuario (demo)

Usuarios habilitados:

- `valeria` / `1207` → Wholesale, Finanzas, Marketing, Operaciones.
- `veronica` / `1234` → Operaciones.
- `valentina` / `5678` → Marketing, Wholesale.
- `sandra` / `9112` → Finanzas.
- `carlos` / `1234` → Wholesale, Marketing.
- `luis` / `5678` → Finanzas.
- `juan` / `9112` → Marketing.
- `margarita` / `1234` → Marketing.
- `sofia` / `5678` → Finanzas, Marketing.
- `teresita` / `9112` → Wholesale, Finanzas, Marketing, Operaciones.
- `invitado` → usuario técnico de respaldo (sin acceso desde UI).

Modo actual: se valida usuario + clave para aplicar acceso por carpetas.

Clave maestra de respaldo (temporal): `2026` (permite acceso completo).

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

## Si lo ves con “otro color” (oscuro/azul)

Eso normalmente **no es la intranet**, sino el tema visual de GitHub (modo oscuro).

Para validar la intranet real:

1. Abre la URL publicada del sitio (no el PR):  
   `https://valeriamch-cpu.github.io/New-Intranet/`
2. Haz recarga forzada del navegador:
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
3. Si sigue igual, abre en modo incógnito para evitar caché.

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
