/**
 * admin-layout.js - VERSIÓN FINAL CORREGIDA
 * Gestiona el layout administrativo con sidebar y permisos
 */

let usuarioActual = null;
let sesionActual = null;

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarLayoutAdmin();
});

async function inicializarLayoutAdmin() {
    try {
        console.log('🔍 Verificando sesión administrativa...');
        
        // Usar la función de api.js
        const resultado = await obtenerSesionActual();
        
        console.log('📦 Datos de sesión:', resultado);
        
        if (!resultado.success || !resultado.data) {
            console.error('❌ Sesión inválida');
            mostrarError('Sesión inválida. Redirigiendo...');
            setTimeout(() => window.location.href = '/', 1500);
            return;
        }
        
        usuarioActual = resultado.data.usuario;
        sesionActual = resultado.data.sesion;
        
        console.log('👤 Usuario:', usuarioActual.email);
        console.log('🎭 Rol:', sesionActual.rol);
        console.log('🏢 Es empleado:', sesionActual.es_empleado);
        
        // Verificar que sea empleado
        if (!sesionActual.es_empleado) {
            console.warn('⚠️ Usuario no es empleado');
            mostrarError('Acceso denegado. Solo empleados pueden acceder.');
            setTimeout(() => window.location.href = '/', 2000);
            return;
        }
        
        // Actualizar UI
        actualizarInfoUsuario();
        generarMenuSegunRol(sesionActual.rol);
        marcarItemActivo();
        
        console.log('✅ Layout administrativo inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando layout:', error);
        mostrarError('Error al verificar sesión. Redirigiendo...');
        setTimeout(() => window.location.href = '/', 2000);
    }
}

// ======================
// INFO DEL USUARIO
// ======================

function actualizarInfoUsuario() {
    try {
        // Avatar con iniciales
        const iniciales = `${usuarioActual.nombre[0]}${usuarioActual.apellido[0]}`.toUpperCase();
        const avatarElement = document.getElementById('sidebarUserAvatar');
        if (avatarElement) {
            avatarElement.textContent = iniciales;
        }
        
        // Nombre completo
        const nameElement = document.getElementById('sidebarUserName');
        if (nameElement) {
            nameElement.textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
        }
        
        // Rol
        const roleElement = document.getElementById('sidebarUserRole');
        if (roleElement) {
            roleElement.textContent = sesionActual.rol.toUpperCase();
        }
        
        console.log('✅ Info de usuario actualizada');
    } catch (error) {
        console.error('Error actualizando info:', error);
    }
}

// ======================
// GENERACIÓN DEL MENÚ
// ======================

function generarMenuSegunRol(rol) {
    const rolNombre = rol.toLowerCase();
    
    // Configuración del menú según rol
    const menuConfig = {
        admin: [
            {
                seccion: 'Principal',
                items: [
                    { icon: 'bi-speedometer2', texto: 'Dashboard', url: '/admin/dashboard.html' },
                    { icon: 'bi-cart-check', texto: 'POS - Punto de Venta', url: '/admin/pos.html', badge: 'HOT' }
                ]
            },
            {
                seccion: 'Ventas',
                items: [
                    { icon: 'bi-receipt', texto: 'Facturas', url: '/admin/facturas.html' },
                    { icon: 'bi-file-earmark-text', texto: 'Cotizaciones', url: '/admin/cotizaciones.html' }
                ]
            },
            {
                seccion: 'Inventario',
                items: [
                    { icon: 'bi-box-seam', texto: 'Productos', url: '/admin/productos.html' },
                    { icon: 'bi-boxes', texto: 'Lotes', url: '/admin/lotes.html' },
                    { icon: 'bi-building', texto: 'Inventario por Sucursal', url: '/admin/inventario.html' }
                ]
            },
            {
                seccion: 'Catálogos',
                items: [
                    { icon: 'bi-tag', texto: 'Categorías', url: '/admin/categorias.html' },
                    { icon: 'bi-award', texto: 'Marcas', url: '/admin/marcas.html' },
                    { icon: 'bi-palette', texto: 'Colores', url: '/admin/colores.html' }
                ]
            },
            {
                seccion: 'Usuarios',
                items: [
                    { icon: 'bi-people', texto: 'Usuarios', url: '/admin/usuarios.html' },
                    { icon: 'bi-person-badge', texto: 'Roles y Permisos', url: '/admin/roles.html' },
                    { icon: 'bi-person-check', texto: 'Clientes', url: '/admin/clientes.html' }
                ]
            },
            {
                seccion: 'Configuración',
                items: [
                    { icon: 'bi-shop', texto: 'Sucursales', url: '/admin/sucursales.html' },
                    { icon: 'bi-truck', texto: 'Proveedores', url: '/admin/proveedores.html' },
                    { icon: 'bi-bar-chart-line', texto: 'Reportes', url: '/admin/reportes.html' }
                ]
            }
        ],
        gerente: [
            {
                seccion: 'Principal',
                items: [
                    { icon: 'bi-speedometer2', texto: 'Dashboard', url: '/admin/dashboard.html' },
                    { icon: 'bi-cart-check', texto: 'POS', url: '/admin/pos.html' }
                ]
            },
            {
                seccion: 'Ventas',
                items: [
                    { icon: 'bi-receipt', texto: 'Facturas', url: '/admin/facturas.html' }
                ]
            },
            {
                seccion: 'Inventario',
                items: [
                    { icon: 'bi-box-seam', texto: 'Productos', url: '/admin/productos.html' },
                    { icon: 'bi-boxes', texto: 'Lotes', url: '/admin/lotes.html' },
                    { icon: 'bi-building', texto: 'Inventario', url: '/admin/inventario.html' }
                ]
            },
            {
                seccion: 'Reportes',
                items: [
                    { icon: 'bi-bar-chart-line', texto: 'Reportes', url: '/admin/reportes.html' }
                ]
            }
        ],
        cajero: [
            {
                seccion: 'Principal',
                items: [
                    { icon: 'bi-cart-check', texto: 'POS - Punto de Venta', url: '/admin/pos.html' }
                ]
            },
            {
                seccion: 'Ventas',
                items: [
                    { icon: 'bi-receipt', texto: 'Mis Facturas', url: '/admin/facturas.html' }
                ]
            }
        ],
        digitador: [
            {
                seccion: 'Principal',
                items: [
                    { icon: 'bi-speedometer2', texto: 'Dashboard', url: '/admin/dashboard.html' }
                ]
            },
            {
                seccion: 'Inventario',
                items: [
                    { icon: 'bi-box-seam', texto: 'Productos', url: '/admin/productos.html' },
                    { icon: 'bi-boxes', texto: 'Lotes', url: '/admin/lotes.html' }
                ]
            }
        ]
    };
    
    const config = menuConfig[rolNombre] || menuConfig.cajero;
    renderizarMenu(config);
}

function renderizarMenu(config) {
    const navElement = document.getElementById('sidebarNav');
    if (!navElement) return;
    
    let html = '';
    
    config.forEach(seccion => {
        html += `<div class="nav-section-title">${seccion.seccion}</div>`;
        
        seccion.items.forEach(item => {
            html += `
                <div class="nav-item">
                    <a href="${item.url}" class="nav-link">
                        <i class="${item.icon}"></i>
                        <span>${item.texto}</span>
                        ${item.badge ? `<span class="badge bg-danger">${item.badge}</span>` : ''}
                    </a>
                </div>
            `;
        });
    });
    
    navElement.innerHTML = html;
}

// ======================
// MARCAR ITEM ACTIVO
// ======================

function marcarItemActivo() {
    const paginaActual = window.location.pathname;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && paginaActual.includes(href)) {
            link.classList.add('active');
        }
    });
}

// ======================
// TOGGLE SIDEBAR (MOBILE)
// ======================

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('active');
}

// ======================
// CERRAR SESIÓN
// ======================

async function cerrarSesionAdmin() {
    if (!confirm('¿Estás seguro de cerrar sesión?')) return;
    
    try {
        await cerrarSesion();
        window.location.href = '/';
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '/';
    }
}

// ======================
// UTILIDADES
// ======================

function actualizarBreadcrumb(items) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    let html = '<li class="breadcrumb-item"><a href="/admin/dashboard.html">Inicio</a></li>';
    
    items.forEach((item, index) => {
        if (index === items.length - 1) {
            html += `<li class="breadcrumb-item active">${item}</li>`;
        } else {
            html += `<li class="breadcrumb-item"><a href="#">${item}</a></li>`;
        }
    });
    
    breadcrumb.innerHTML = html;
}

function actualizarTituloPagina(titulo) {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titulo;
    }
    document.title = `${titulo} | Paints Admin`;
}