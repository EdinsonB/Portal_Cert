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
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); z-index: 10000; display: flex;
      align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
        <h3>🔧 Configuración GitHub</h3>
        <p>Para guardar avances en la nube, necesita su token personal de GitHub:</p>
        
        <label><strong>Token Personal:</strong></label>
        <input type="password" id="github-token" placeholder="ghp_..." style="width: 100%; margin: 5px 0 15px; padding: 8px;">
        
        <details style="margin: 15px 0;">
          <summary>¿Cómo obtener el token? 👆 Click aquí</summary>
          <ol style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
            <li>Ir a GitHub → Settings → Developer settings</li>
            <li>Personal access tokens → Tokens (classic)</li>
            <li>Generate new token → Note: "Portal Cert"</li>
            <li>Seleccionar scope: <code>repo</code> ✅</li>
            <li>Generate token y copiar</li>
          </ol>
        </details>
        
        <div style="text-align: center; margin-top: 20px;">
          <button type="button" id="btn-guardar-config" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px;">Guardar</button>
          <button type="button" id="btn-cancelar-config" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px;">Usar sin GitHub</button>
        </div>
      </div>
    `;

    modal.guardarConfig = () => {
      const token = document.getElementById('github-token').value.trim();
      
      if (!token) {
        alert('Debe ingresar el token personal');
        return;
      }
      
      this.token = token;
      localStorage.setItem('github_owner', this.owner);
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_repo', this.repo);
      
      console.log('Configuración guardada:', { owner: this.owner, repo: this.repo, token: token.substring(0, 10) + '...' });
      
      document.body.removeChild(modal);
      if (modal.onclose) modal.onclose();
    };

    modal.cancelarConfig = () => {
      document.body.removeChild(modal);
      if (modal.onclose) modal.onclose();
    };

    // Agregar event listeners después de crear el modal
    setTimeout(() => {
      const btnGuardar = document.getElementById('btn-guardar-config');
      const btnCancelar = document.getElementById('btn-cancelar-config');
      
      if (btnGuardar) btnGuardar.onclick = modal.guardarConfig;
      if (btnCancelar) btnCancelar.onclick = modal.cancelarConfig;
    }, 100);

    document.body.appendChild(modal);
    return modal;
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
