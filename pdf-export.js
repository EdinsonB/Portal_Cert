/**
 * =============================================================================
 * EXPORTACIÓN PDF - FUNCIONALIDADES
 * Generación de PDF con formato profesional
 * =============================================================================
 */

// =============================================================================
// UTILIDAD: ESPERAR CARGA DE IMÁGENES
// =============================================================================
function waitForImages(root) {
  const imgs = Array.from((root || document).querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  
  return Promise.all(
    imgs.map(img => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(res => {
        img.onload = () => res();
        img.onerror = () => res();
      });
    })
  );
}

// =============================================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
// =============================================================================
async function exportarPDF() {
  try {
    // 1) Datos base
    const tituloDoc = (document.querySelector('.container h2')?.textContent || 
                      document.querySelector('h2')?.textContent || 
                      document.title || 
                      'Documento');
    
    // Solicitar el nombre de la empresa antes de continuar - SIEMPRE PREGUNTAR
    let empresa = prompt('Ingrese el nombre de la empresa a certificar:');
    if (!empresa || empresa.trim() === '') {
      mostrarMensaje('Operación cancelada. Se requiere el nombre de la empresa para generar el PDF.', 'error');
      return;
    }
    empresa = empresa.trim();
    localStorage.setItem('empresaCert', empresa);
    
    const fechaActual = new Date().toLocaleDateString('es-CO');

    // 2) Utilidades
    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
      }[m]));
    }

    // 3) Plantilla HTML con cabecera profesional
    const plantillaHTML = createPDFTemplate(tituloDoc, empresa, fechaActual);

    // 4) Generar contenido de items
    const itemsHTML = generateItemsHTML();

    // 5) HTML final
    const htmlFinal = plantillaHTML.replace(/{{ITEMS_CONTENT}}/g, itemsHTML);

    // 6) Render y exportar
    await renderAndExportPDF(htmlFinal);

  } catch (error) {
    console.error('Error al generar PDF:', error);
    mostrarMensaje('Error al generar el PDF: ' + error.message, 'error');
  }
}

// =============================================================================
// GENERACIÓN DE PLANTILLA HTML
// =============================================================================
function createPDFTemplate(titulo, empresa, fecha) {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;'
    }[m]));
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    :root { 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #fff; 
      color: #333; 
      line-height: 1.4; 
    }

    .pdf-header {
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      align-items: center;
      gap: 0; 
      height: 100px; 
      background: #f8f9fa; 
      border: 1px solid #000; 
      padding: 20px;
      width: 100%; 
      box-sizing: border-box;
    }
    
    .col-title { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100%; 
      border-right: 1px solid #000; 
      padding: 0 15px;
    }
    
    .title-text { 
      color: #000; 
      font-weight: 700; 
      font-size: 18px; 
      text-align: center; 
      line-height: 1.4; 
    }

    .col-empresa { 
      height: 100%; 
      display: flex; 
      flex-direction: column; 
      align-items: flex-start; 
      justify-content: center; 
      padding-left: 15px;
    }
    
    .empresa-label { 
      font-size: 16px; 
      color: #000; 
      margin-bottom: 6px; 
      font-weight: 600; 
    }

    .content-area { 
      width: 100%; 
      box-sizing: border-box; 
      border-left: 1px solid #000; 
      border-right: 1px solid #000; 
      border-bottom: 1px solid #000; 
      border-top: none; 
      padding: 0; 
      background: #fff; 
      display: block;
    }
    
    .checklist-item { 
      margin: 0; 
      page-break-inside: avoid; 
      break-inside: avoid; 
      display: block; 
    }
    
    .item-number { 
      font-weight: bold; 
      color: #333; 
      font-size: 1.1em; 
      margin-right: 8px; 
    }
    
    .item-title { 
      font-weight: 600; 
      color: #333; 
      margin: 15px 20px 10px; 
      font-size: 16px; 
      line-height: 1.3; 
      display: block; 
    }
    
    .item-expected { 
      background: #f8f9fa; 
      border: 1px solid #e9ecef; 
      border-radius: 6px; 
      padding: 12px; 
      margin: 0 20px 12px; 
      font-size: 13px; 
      color: #495057; 
    }
    
    .item-expected strong { 
      color: #333; 
      font-size: 14px; 
      display: block; 
      margin-bottom: 8px; 
    }
    
    .item-status { 
      margin: 0 20px 12px; 
      font-size: 14px; 
      display: block; 
    }
    
    .item-status strong { 
      color: #333; 
      margin-right: 8px; 
    }
    
    .item-evidence { 
      background: #fafbfc; 
      border: 1px solid #e9ecef; 
      border-radius: 6px; 
      padding: 15px; 
      min-height: 60px; 
      font-size: 13px; 
      color: #495057; 
      margin: 0 20px 20px; 
    }
    
    .item-evidence img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 4px; 
      margin: 8px 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.08); 
    }

    .status-aprobado { 
      color: #28a745; 
      font-weight: bold; 
      background: #d4edda; 
      padding: 4px 12px; 
      border-radius: 6px; 
      display: inline-block; 
    }
    
    .status-no-aprobado { 
      color: #dc3545; 
      font-weight: bold; 
      background: #f8d7da; 
      padding: 4px 12px; 
      border-radius: 6px; 
      display: inline-block; 
    }
    
    .status-no-aplica { 
      color: #6c757d; 
      font-weight: bold; 
      background: #e9ecef; 
      padding: 4px 12px; 
      border-radius: 6px; 
      display: inline-block; 
    }
    
    .status-pendiente { 
      color: #856404; 
      font-weight: bold; 
      background: #fff3cd; 
      padding: 4px 12px; 
      border-radius: 6px; 
      display: inline-block; 
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="col-title">
      <div class="title-text">${escapeHtml(titulo)}</div>
    </div>
    <div class="col-empresa">
      <div class="empresa-label">Empresa: ${escapeHtml(empresa)}</div>
      <div class="empresa-label">Fecha: ${fecha}</div>
    </div>
  </div>
  <div class="content-area">
    {{ITEMS_CONTENT}}
  </div>
</body>
</html>`;
}

// =============================================================================
// GENERACIÓN DE CONTENIDO DE ITEMS
// =============================================================================
function generateItemsHTML() {
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;'
    }[m]));
  }

  let itemsHTML = '';
  
  checklistItems.forEach((item, idx) => {
    const aprobado = (camposEstado[`aprobado_${item.id}`] || '').trim();
    const evidencias = (camposEstado[`evidencias_${item.id}`] || '').trim();
    
    let estadoClase = 'pendiente';
    switch (aprobado.toLowerCase()) {
      case 'aprobado': 
        estadoClase = 'aprobado'; 
        break;
      case 'no aprobado': 
        estadoClase = 'no-aprobado'; 
        break;
      case 'no aplica': 
        estadoClase = 'no-aplica'; 
        break;
    }
    
    itemsHTML += `
      <div class="checklist-item">
        <div class="item-title">
          <span class="item-number">${idx + 1}.</span> ${escapeHtml(item.texto)}
        </div>
        <div class="item-expected">
          <strong>¿Qué se espera?</strong><br>${escapeHtml(item.esperado)}
        </div>
        <div class="item-status">
          <strong>Estado:</strong> 
          <span class="status-${estadoClase}">${escapeHtml(aprobado || 'Sin seleccionar')}</span>
        </div>
        <div class="item-evidence">
          <strong>Evidencias:</strong><br>${evidencias || ''}
        </div>
      </div>`;
  });
  
  return itemsHTML;
}

// =============================================================================
// RENDERIZADO Y EXPORTACIÓN
// =============================================================================
async function renderAndExportPDF(htmlContent) {
  // Crear elemento temporal para renderizado
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-99999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '900px';
  tempDiv.style.background = '#fff';
  tempDiv.style.zIndex = '-1';
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  // Esperar a que carguen las imágenes
  await waitForImages(tempDiv);

  // Generar canvas con html2canvas
  const canvas = await html2canvas(tempDiv, {
    scale: 1,
    backgroundColor: '#fff',
    useCORS: true,
    windowWidth: tempDiv.scrollWidth,
    windowHeight: tempDiv.scrollHeight,
    scrollY: -window.scrollY,
    allowTaint: true,
    imageTimeout: 15000,
  });

  // Crear PDF
  const pdf = new window.jspdf.jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const imgWidth = pageWidth - margin * 2;
  let y = 0;
  let page = 0;
  const maxPageHeight = pageHeight - margin * 2;

  // Dividir contenido en páginas
  while (y < canvas.height) {
    if (page > 0) pdf.addPage();
    
    const availableHeight = Math.min(maxPageHeight, canvas.height - y);
    const sliceHeight = Math.min(availableHeight * canvas.width / imgWidth, canvas.height - y);
    
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    
    const ctx2 = pageCanvas.getContext('2d');
    ctx2.fillStyle = '#fff';
    ctx2.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx2.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    
    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const drawHeight = (sliceHeight * imgWidth) / canvas.width;
    
    pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, drawHeight);
    
    y += sliceHeight;
    page++;
  }

  // Guardar PDF
  pdf.save('checklist_certificacion_ach.pdf');
  
  // Limpiar elemento temporal
  document.body.removeChild(tempDiv);
  
  mostrarMensaje('PDF generado exitosamente', 'success');
}
