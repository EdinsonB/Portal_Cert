/**
 * =============================================================================
 * GITHUB API - GESTIÓN DE AVANCES EN LA NUBE
 * Sistema de guardado/carga usando GitHub como base de datos
 * =============================================================================
 */

class GitHubStorage {
  constructor() {
    this.token = localStorage.getItem('github_token');
    this.owner = localStorage.getItem('github_owner') || 'EdinsonB'; // Usuario por defecto
    this.repo = localStorage.getItem('github_repo') || 'Portal_Cert'; // Repositorio por defecto
    this.apiBase = 'https://api.github.com';
  }

  // Configurar credenciales de GitHub
  async configurar() {
    // Si ya tenemos el token, no mostrar modal
    if (this.token) {
      return true;
    }
    
    // Solo pedir el token si no lo tenemos
    const modal = this.crearModalConfiguracion();
    return new Promise((resolve) => {
      modal.onclose = () => resolve(this.token);
    });
  }

  crearModalConfiguracion() {
    // Limpiar modales previos que puedan existir
    const existingModals = document.querySelectorAll('[id^="github-config-modal-"]');
    existingModals.forEach(modal => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    });
    
    // Crear modal completamente nuevo
    const modalId = 'github-config-modal-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white; padding: 30px; border-radius: 10px; 
      max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    content.innerHTML = `
      <h3 style="margin-top: 0;">🔧 Configuración GitHub</h3>
      <p>Para guardar avances en la nube, necesita su token personal de GitHub:</p>
      
      <label style="display: block; font-weight: bold; margin: 10px 0 5px;">Token Personal:</label>
      <input type="password" 
             id="token-input-${modalId}" 
             placeholder="ghp_..." 
             style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      
      <details style="margin: 15px 0;">
        <summary style="cursor: pointer;">¿Cómo obtener el token? 👆 Click aquí</summary>
        <ol style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
          <li>Ir a GitHub → Settings → Developer settings</li>
          <li>Personal access tokens → Tokens (classic)</li>
          <li>Generate new token → Note: "Portal Cert"</li>
          <li>Seleccionar scope: <code>repo</code> ✅</li>
          <li>Generate token y copiar</li>
        </ol>
      </details>
      
      <div style="text-align: center; margin-top: 20px;">
        <button id="btn-save-${modalId}" 
                style="background: #28a745; color: white; border: none; 
                       padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
          Guardar
        </button>
        <button id="btn-cancel-${modalId}" 
                style="background: #dc3545; color: white; border: none; 
                       padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Usar sin GitHub
        </button>
      </div>
    `;
    
    overlay.appendChild(content);
    
    // Función para cerrar modal
    const closeModal = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      if (overlay.onclose) overlay.onclose();
    };
    
    // Función para guardar (con this context preservado)
    const saveFunction = (() => {
      const self = this; // Capturar contexto
      return () => {
        const tokenInput = document.getElementById(`token-input-${modalId}`);
        if (!tokenInput) {
          console.error('❌ Input de token no encontrado');
          return;
        }
        
        const token = tokenInput.value.trim();
        if (!token) {
          alert('❌ Debe ingresar el token personal');
          tokenInput.focus();
          return;
        }
        
        // Validar formato básico del token
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
          if (!confirm('⚠️ El token no parece tener el formato correcto. ¿Continuar?')) {
            return;
          }
        }
        
        // Guardar configuración
        self.token = token;
        localStorage.setItem('github_owner', self.owner);
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_repo', self.repo);
        
        console.log('✅ Configuración guardada:', { 
          owner: self.owner, 
          repo: self.repo, 
          token: token.substring(0, 10) + '...' 
        });
        
        alert('✅ Configuración guardada correctamente');
        closeModal();
      };
    })();
    
    // Agregar modal al DOM
    document.body.appendChild(overlay);
    
    // Asignar eventos después de agregar al DOM
    const saveBtn = document.getElementById(`btn-save-${modalId}`);
    const cancelBtn = document.getElementById(`btn-cancel-${modalId}`);
    const tokenInput = document.getElementById(`token-input-${modalId}`);
    
    if (saveBtn) {
      saveBtn.onclick = saveFunction;
      console.log('✅ Evento save asignado');
    }
    
    if (cancelBtn) {
      cancelBtn.onclick = closeModal;
      console.log('✅ Evento cancel asignado');
    }
    
    if (tokenInput) {
      tokenInput.focus();
      // Permitir guardar con Enter
      tokenInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          saveFunction();
        }
      };
    }
    
    return overlay;
  }

  // Verificar si existe archivo de avances para un cliente
  async verificarCliente(numeroCliente) {
    if (!await this.configurar()) return false;

    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/avances/${numeroCliente}.json`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      return response.ok;
    } catch (error) {
      console.log('Cliente nuevo o error de conexión:', error);
      return false;
    }
  }

  // Cargar avances de un cliente
  async cargarAvances(numeroCliente) {
    if (!await this.configurar()) throw new Error('Configuración cancelada');

    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/avances/${numeroCliente}.json`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No existen avances para este cliente');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      return { content, sha: data.sha };
    } catch (error) {
      throw new Error(`Error al cargar avances: ${error.message}`);
    }
  }

  // Guardar avances de un cliente
  async guardarAvances(numeroCliente, avances, sha = null) {
    if (!await this.configurar()) throw new Error('Configuración cancelada');

    const data = {
      numeroCliente,
      avances,
      fechaActualizacion: new Date().toISOString()
    };

    const body = {
      message: `Actualizar avances cliente ${numeroCliente}`,
      content: btoa(JSON.stringify(data, null, 2))
    };

    if (sha) {
      body.sha = sha;
    }

    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/avances/${numeroCliente}.json`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.content.sha;
    } catch (error) {
      throw new Error(`Error al guardar avances: ${error.message}`);
    }
  }

  // Verificar conexión y permisos
  async verificarConexion() {
    if (!this.token || !this.owner) return false;

    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instancia global
window.githubStorage = new GitHubStorage();
