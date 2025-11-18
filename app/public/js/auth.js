// Estado de autenticación
let usuarioActual = null;

// Verificar si hay sesión activa al cargar
document.addEventListener('DOMContentLoaded', verificarSesion);

async function verificarSesion() {
    try {
        const response = await fetchAPI('/auth/session');
        if (response.success) {
            usuarioActual = response.data;
            actualizarUIUsuario();
        }
    } catch (error) {
        usuarioActual = null;
    }
}

function actualizarUIUsuario() {
    const userNameElement = document.getElementById('user-name');
    const userMenuElement = document.getElementById('user-menu');

    if (usuarioActual) {
        // Usuario logueado
        userNameElement.textContent = usuarioActual.nombre;
        
        // Actualizar menú
        const dropdown = userMenuElement.querySelector('.dropdown-menu');
        dropdown.innerHTML = `
            <li><a class="dropdown-item" href="#">
                <i class="bi bi-person"></i> Mi Perfil
            </a></li>
            <li><a class="dropdown-item" href="#">
                <i class="bi bi-box-seam"></i> Mis Pedidos
            </a></li>
            <li><hr class="dropdown-divider"></li>
            ${usuarioActual.es_empleado ? `
            <li><a class="dropdown-item" href="/admin/dashboard.html">
                <i class="bi bi-speedometer2"></i> Panel Admin
            </a></li>
            <li><hr class="dropdown-divider"></li>
            ` : ''}
            <li><a class="dropdown-item" href="#" onclick="cerrarSesion()">
                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </a></li>
        `;
    } else {
        // Usuario no logueado
        userNameElement.textContent = 'Ingresar';
    }
}

// Login
async function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            usuarioActual = response.data.usuario;
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            modal.hide();

            // Actualizar UI
            actualizarUIUsuario();

            // Mostrar mensaje
            mostrarNotificacion('Bienvenido ' + usuarioActual.nombre, 'success');

            // Si es empleado, redirigir al dashboard
            if (usuarioActual.es_empleado) {
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 1500);
            }
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al iniciar sesión', 'error');
    }
}

// Registro
async function registro(event) {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById('regNombre').value,
        apellido: document.getElementById('regApellido').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        telefono: document.getElementById('regTelefono').value
    };

    try {
        const response = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        if (response.success) {
            mostrarNotificacion('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
            mostrarLogin();
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al registrarse', 'error');
    }
}

// Cerrar sesión
async function cerrarSesion() {
    try {
        await fetchAPI('/auth/logout', { method: 'POST' });
        usuarioActual = null;
        actualizarUIUsuario();
        mostrarNotificacion('Sesión cerrada', 'success');
        
        // Si está en página admin, redirigir
        if (window.location.pathname.includes('/admin/')) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Mostrar modal de login
function mostrarLogin() {
    document.getElementById('authModalLabel').textContent = 'Iniciar Sesión';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registroForm').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
}

// Mostrar modal de registro
function mostrarRegistro() {
    document.getElementById('authModalLabel').textContent = 'Crear Cuenta';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroForm').style.display = 'block';
    
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
}

// Notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}