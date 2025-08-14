# 📋 Instrucciones para subir a GitHub

## Paso 1: Crear repositorio en GitHub
1. Ir a https://github.com
2. Click en "New repository" (botón verde)
3. Nombre: `Portal_Cert`
4. Marcar "Public" ✅
5. NO marcar "Add a README file" (ya tenemos uno)
6. Click "Create repository"

## Paso 2: Subir archivos
1. En la página del repositorio recién creado, click "uploading an existing file"
2. Arrastrar TODOS los archivos de la carpeta:
   - index.html
   - script.js
   - pdf-export.js
   - github-storage.js
   - styles.css
   - correccion_logo.js
   - pagina_certificacion_V5.html
   - README.md
   - .gitignore
   - carpeta img/ completa
   - carpeta backup/ completa
   - carpeta avances/ (vacía)

3. Escribir mensaje: "Initial commit - Portal de Certificación API"
4. Click "Commit changes"

## Paso 3: Activar GitHub Pages
1. En el repositorio, ir a "Settings" (pestaña)
2. Scroll down hasta "Pages" (menú izquierdo)
3. En "Source" seleccionar "Deploy from a branch"
4. Branch: "main" (o "master")
5. Folder: "/ (root)"
6. Click "Save"
7. Esperar 1-2 minutos

## Paso 4: Obtener URL del portal
Tu portal estará disponible en:
```
https://TU_USUARIO.github.io/Portal_Cert
```

## Paso 5: Crear Personal Access Token
1. GitHub → Settings (tu perfil) → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token (classic)"
4. Note: "Portal Cert Access"
5. Scopes: marcar solo "repo" ✅
6. "Generate token"
7. **COPIAR EL TOKEN** (solo se muestra una vez)

## Paso 6: Configurar en el portal
1. Abrir tu portal: https://TU_USUARIO.github.io/Portal_Cert
2. Al cargar por primera vez aparecerá modal de configuración
3. Ingresar tu usuario GitHub y el token
4. ¡Listo! Los avances se guardarán automáticamente en GitHub

## ⚠️ Importante
- El token es como una contraseña, no lo compartas
- Si pierdes el token, genera uno nuevo
- Los archivos se guardarán en la carpeta `avances/` de tu repositorio
