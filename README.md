# New-Intranet

Prototipo de intranet con:

- Calendario principal de eventos importantes.
- Botones por secciones: Operaciones (Equipos), Finanzas, Wholesale, Marketing y Gestión.
- Calendario por cada equipo con sus propios eventos.
- Formulario para agregar eventos al equipo seleccionado.

## Uso rápido en local

1. Ejecuta un servidor local:

   ```bash
   python3 -m http.server 8080
   ```

2. Abre en tu navegador:

   ```
   http://localhost:8080
   ```

## Publicación automática (GitHub Pages)

Se agregó el workflow `.github/workflows/deploy-pages.yml`.

### Qué hace

- Publica automáticamente en GitHub Pages cada vez que hay un push a `main`.
- También permite publicación manual desde la pestaña **Actions** (`workflow_dispatch`).

### Cómo activarlo en el repositorio

1. En GitHub ve a **Settings > Pages**.
2. En **Build and deployment**, selecciona **Source: GitHub Actions**.
3. Haz push de esta rama a `main`.
4. Espera a que termine el workflow **Deploy static intranet to GitHub Pages**.
5. GitHub mostrará la URL pública (normalmente `https://<usuario>.github.io/<repo>/`).
