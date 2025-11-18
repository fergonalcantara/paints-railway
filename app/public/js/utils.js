/**
 * utils.js - Funciones utilitarias globales
 */

// Mostrar notificación de éxito
function mostrarExito(mensaje) {
    mostrarNotificacion(mensaje, 'success');
}

// Mostrar notificación de error
function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'danger');
}

// Mostrar notificación de advertencia
function mostrarAdvertencia(mensaje) {
    mostrarNotificacion(mensaje, 'warning');
}

// Mostrar notificación de información
function mostrarInfo(mensaje) {
    mostrarNotificacion(mensaje, 'info');
}

// Función base para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    alerta.style.maxWidth = '500px';
    
    // Iconos según el tipo
    const iconos = {
        success: 'bi-check-circle',
        danger: 'bi-exclamation-triangle',
        warning: 'bi-exclamation-circle',
        info: 'bi-info-circle'
    };
    
    const icono = iconos[tipo] || iconos.info;
    
    alerta.innerHTML = `
        <i class="bi ${icono} me-2"></i>${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alerta);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 150);
    }, 5000);
}

// Formatear precio en Quetzales
function formatearPrecio(precio) {
    return `Q${parseFloat(precio).toFixed(2)}`;
}

// Formatear fecha
function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear fecha y hora
function formatearFechaHora(fecha) {
    const date = new Date(fecha);
    return date.toLocaleString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validar NIT guatemalteco
function validarNIT(nit) {
    // Remover guiones y espacios
    nit = nit.replace(/[-\s]/g, '');
    
    // Verificar que solo contenga números
    if (!/^\d+$/.test(nit)) {
        return false;
    }
    
    // Verificar longitud (mínimo 7, máximo 8 dígitos)
    if (nit.length < 7 || nit.length > 8) {
        return false;
    }
    
    return true;
}

// Validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validar teléfono guatemalteco
function validarTelefono(telefono) {
    // Remover caracteres especiales
    telefono = telefono.replace(/[\s\-()]/g, '');
    
    // Debe tener 8 dígitos
    return /^\d{8}$/.test(telefono);
}

// Debounce para búsquedas
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Confirmar acción
function confirmarAccion(mensaje, callback) {
    if (confirm(mensaje)) {
        callback();
    }
}

// Loading spinner
function mostrarLoading(contenedor) {
    contenedor.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Cargando...</p>
        </div>
    `;
}

// Calcular edad desde fecha de nacimiento
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

// Generar código aleatorio (para SKU, etc.)
function generarCodigo(prefijo = '', longitud = 6) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = prefijo;
    
    for (let i = 0; i < longitud; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    return codigo;
}

// Copiar al portapapeles
async function copiarAlPortapapeles(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarExito('Copiado al portapapeles');
    } catch (error) {
        mostrarError('No se pudo copiar');
    }
}

// Descargar archivo
function descargarArchivo(contenido, nombreArchivo, tipo = 'text/plain') {
    const blob = new Blob([contenido], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}