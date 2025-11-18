/**
 * api.js - Cliente API centralizado
 * Versión compatible con desarrollo local y producción (Railway)
 */

// ✅ API Base URL - Detección automática de entorno
const API_BASE_URL = (() => {
    // Si estás en localhost, usa la URL completa
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // En producción (Railway, Netlify, etc.), usa rutas relativas
    return '/api';
})();

console.log('🌐 API Base URL:', API_BASE_URL);

// Helper para hacer peticiones
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies (sesión)
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== PRODUCTOS ==========
async function obtenerProductos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/productos${queryString ? '?' + queryString : ''}`);
}

async function obtenerProductoPorId(id) {
    return await fetchAPI(`/productos/${id}`);
}

async function buscarProductos(query) {
    return await fetchAPI(`/productos?buscar=${encodeURIComponent(query)}`);
}

async function crearProducto(datos) {
    return await fetchAPI('/productos', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function actualizarProducto(id, datos) {
    return await fetchAPI(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

async function eliminarProducto(id) {
    return await fetchAPI(`/productos/${id}`, {
        method: 'DELETE'
    });
}

async function obtenerStockProducto(id) {
    return await fetchAPI(`/productos/${id}/stock`);
}

// ========== CATEGORÍAS ==========
async function obtenerCategorias() {
    return await fetchAPI('/catalogo/categorias');
}

// ========== MARCAS ==========
async function obtenerMarcas() {
    return await fetchAPI('/catalogo/marcas');
}

// ========== UNIDADES DE MEDIDA ==========
async function obtenerUnidadesMedida() {
    return await fetchAPI('/catalogo/unidades-medida');
}

// ========== COLORES ==========
async function obtenerColores() {
    return await fetchAPI('/catalogo/colores');
}

// ========== SUCURSALES ==========
async function obtenerSucursales() {
    return await fetchAPI('/sucursales');
}

async function obtenerSucursalCercana(latitud, longitud) {
    return await fetchAPI(`/sucursales/cercana?latitud=${latitud}&longitud=${longitud}`);
}

// ========== CLIENTES ==========
async function obtenerClientes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/clientes${queryString ? '?' + queryString : ''}`);
}

async function buscarCliente(nit) {
    return await fetchAPI(`/clientes/buscar?nit=${encodeURIComponent(nit)}`);
}

async function crearCliente(datos) {
    return await fetchAPI('/clientes', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== INVENTARIO ==========
async function obtenerInventario(sucursalId) {
    return await fetchAPI(`/inventario?sucursal_id=${sucursalId}`);
}

async function obtenerInventarioPorProducto(productoId) {
    return await fetchAPI(`/inventario/producto/${productoId}`);
}

// ========== LOTES ==========
async function obtenerLotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/inventario/lotes${queryString ? '?' + queryString : ''}`);
}

async function crearLote(datos) {
    return await fetchAPI('/inventario/lotes', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function asignarLoteASucursal(loteId, datos) {
    return await fetchAPI(`/inventario/lotes/${loteId}/asignar`, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== FACTURAS ==========
async function crearFactura(datos) {
    return await fetchAPI('/facturas', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function obtenerFacturas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/facturas${queryString ? '?' + queryString : ''}`);
}

async function obtenerFacturaPorNumero(numeroFactura) {
    return await fetchAPI(`/facturas/${numeroFactura}`);
}

async function anularFactura(numeroFactura, motivo) {
    return await fetchAPI(`/facturas/${numeroFactura}/anular`, {
        method: 'POST',
        body: JSON.stringify({ motivo, requiere_devolucion_inventario: 1 })
    });
}

// ========== REPORTES ==========
async function obtenerReporte(tipo, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/reportes/${tipo}${queryString ? '?' + queryString : ''}`);
}

// ========== MÉTODOS DE PAGO ==========
async function obtenerMetodosPago() {
    return await fetchAPI('/catalogo/metodos-pago');
}

// ========== PROVEEDORES ==========
async function obtenerProveedores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/proveedores${queryString ? '?' + queryString : ''}`);
}

// ========== COTIZACIONES ==========
async function crearCotizacion(datos) {
    return await fetchAPI('/cotizaciones', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function obtenerCotizaciones(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/cotizaciones${queryString ? '?' + queryString : ''}`);
}

// ========== AUTENTICACIÓN ==========
async function obtenerSesionActual() {
    return await fetchAPI('/auth/session');
}

async function iniciarSesion(email, password) {
    return await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

async function cerrarSesion() {
    return await fetchAPI('/auth/logout', {
        method: 'POST'
    });
}

async function registrarUsuario(datos) {
    return await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== INVENTARIO ==========
async function obtenerInventarioPorSucursal(sucursalId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/inventario/sucursal/${sucursalId}${queryString ? '?' + queryString : ''}`);
}

async function actualizarInventario(datos) {
    return await fetchAPI('/inventario', {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

async function registrarLote(datos) {
    return await fetchAPI('/inventario/lote', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function obtenerLotesDeProducto(productoId) {
    return await fetchAPI(`/inventario/lotes/${productoId}`);
}

async function obtenerProductosBajoStock(sucursalId = null) {
    return await fetchAPI(`/inventario/bajo-stock${sucursalId ? '?sucursal_id=' + sucursalId : ''}`);
}

// ========== PROVEEDORES ==========
async function obtenerProveedores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/proveedores${queryString ? '?' + queryString : ''}`);
}

async function obtenerProveedorPorId(id) {
    return await fetchAPI(`/proveedores/${id}`);
}

async function crearProveedor(datos) {
    return await fetchAPI('/proveedores', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function actualizarProveedor(id, datos) {
    return await fetchAPI(`/proveedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

async function eliminarProveedor(id) {
    return await fetchAPI(`/proveedores/${id}`, {
        method: 'DELETE'
    });
}

// ========== LOTES ==========
async function distribuirLoteExistente(datos) {
    return await fetchAPI('/inventario/lote/distribuir', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== FACTURAS (POS) ==========
async function crearFactura(datos) {
    return await fetchAPI('/facturas', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

async function obtenerFacturaPorNumero(numeroFactura) {
    return await fetchAPI(`/facturas/${numeroFactura}`);
}

async function listarFacturas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/facturas${queryString ? '?' + queryString : ''}`);
}

async function anularFactura(numeroFactura, datos) {
    return await fetchAPI(`/facturas/${numeroFactura}/anular`, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== CLIENTES ==========
async function buscarClientePorNIT(nit) {
    return await fetchAPI(`/clientes/buscar-nit?nit=${encodeURIComponent(nit)}`);
}

async function crearClienteRapido(datos) {
    return await fetchAPI('/clientes/rapido', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

// ========== MÉTODOS DE PAGO ==========
async function obtenerMetodosPago() {
    return await fetchAPI('/metodos-pago');
}

// ========== PRODUCTOS (para POS) ==========
async function buscarProductosPOS(termino, sucursalId) {
    return await fetchAPI(`/productos/pos-buscar?buscar=${encodeURIComponent(termino)}&sucursal_id=${sucursalId}`);
}