# 🔧 Instalación de Git en Windows

## Opción 1: Descarga oficial (Recomendada)

### Paso 1: Descargar Git
1. Ir a https://git-scm.com/download/windows
2. La descarga debería comenzar automáticamente
3. Si no, click en "64-bit Git for Windows Setup"

### Paso 2: Instalar Git
1. Ejecutar el archivo descargado (.exe)
2. **Configuraciones recomendadas durante la instalación:**
   - ✅ Select Components: dejar todo por defecto
   - ✅ Default editor: "Use Visual Studio Code as Git's default editor" (si tienes VS Code)
   - ✅ Path environment: "Git from the command line and also from 3rd-party software"
   - ✅ HTTPS transport: "Use the OpenSSL library"
   - ✅ Line ending conversions: "Checkout Windows-style, commit Unix-style line endings"
   - ✅ Terminal emulator: "Use Windows' default console window"
   - ✅ Git pull behavior: "Default (fast-forward or merge)"
   - ✅ Credential helper: "Git Credential Manager"
   - ✅ Extra options: marcar "Enable file system caching"

### Paso 3: Verificar instalación
1. Abrir PowerShell (Windows + R, escribir "powershell")
2. Ejecutar: `git --version`
3. Debería mostrar algo como: `git version 2.42.0.windows.1`

## Opción 2: Usando Windows Package Manager (winget)

### Si tienes winget instalado:
```powershell
winget install Git.Git
```

## Opción 3: Usando Chocolatey

### Si tienes Chocolatey instalado:
```powershell
choco install git
```

## ⚙️ Configuración inicial de Git

Después de instalar, configurar tu identidad:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

## 🚀 Comandos para subir tu proyecto

Una vez instalado Git, en PowerShell desde tu carpeta del proyecto:

```powershell
# Navegar a tu proyecto
cd "c:\Users\edbarraza\OneDrive - ACH Colombia S. A\Documentos\Portal_Cert"

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit - Portal de Certificación API"

# Conectar con repositorio de GitHub (reemplazar TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/Portal_Cert.git

# Subir archivos
git push -u origin main
```

## ❗ Notas importantes

- **Reiniciar PowerShell** después de instalar Git
- Si tienes problemas, reiniciar la computadora
- Git viene con **Git Bash** (terminal alternativa)
- También instala **Git GUI** (interfaz gráfica)

## 🔍 Solución de problemas

### Si `git --version` no funciona:
1. Reiniciar PowerShell
2. Verificar que Git esté en PATH:
   - Windows + R → "sysdm.cpl"
   - Pestaña "Avanzado" → "Variables de entorno"
   - En "PATH" del sistema debe estar: `C:\Program Files\Git\cmd`

### Si hay error de autenticación:
- Git pedirá usuario/contraseña de GitHub la primera vez
- O usar Personal Access Token como contraseña

¿Quieres que te ayude con algún paso específico?
