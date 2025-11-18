/**
 * facturas.js - Gestión de Facturas
 * Lista, busca, filtra e imprime facturas
 */

// Variables globales
let facturasActuales = [];
let filtrosActivos = {};

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Inicializando módulo de facturas...');
    
    try {
        // Configurar fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('filtroFechaHasta').value = hoy;
        
        // Cargar facturas
        await cargarFacturas();
        
        console.log('✅ Módulo de facturas inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar facturas:', error);
        mostrarError('Error al cargar las facturas');
    }
});

// ======================
// CARGAR Y FILTRAR FACTURAS
// ======================

async function cargarFacturas() {
    try {
        const resultado = await listarFacturas(filtrosActivos);
        
        if (resultado.success && Array.isArray(resultado.data)) {
            facturasActuales = resultado.data;
            renderizarTablaFacturas(facturasActuales);
            actualizarResumen(facturasActuales);
        } else {
            facturasActuales = [];
            renderizarTablaFacturas([]);
            actualizarResumen([]);
        }
    } catch (error) {
        console.error('Error cargando facturas:', error);
        mostrarError('Error al cargar las facturas');
    }
}

function aplicarFiltros() {
    filtrosActivos = {};
    
    const numero = document.getElementById('filtroNumero')?.value.trim();
    if (numero) filtrosActivos.numero_factura = numero;
    
    const cliente = document.getElementById('filtroCliente')?.value.trim();
    if (cliente) filtrosActivos.cliente = cliente;
    
    const fechaDesde = document.getElementById('filtroFechaDesde')?.value;
    if (fechaDesde) filtrosActivos.fecha_desde = fechaDesde;
    
    const fechaHasta = document.getElementById('filtroFechaHasta')?.value;
    if (fechaHasta) filtrosActivos.fecha_hasta = fechaHasta;
    
    const tipoVenta = document.getElementById('filtroTipoVenta')?.value;
    if (tipoVenta) filtrosActivos.tipo_venta = tipoVenta;
    
    const estado = document.getElementById('filtroEstado')?.value;
    if (estado !== '') filtrosActivos.estado = estado;
    
    cargarFacturas();
}

function limpiarFiltros() {
    document.getElementById('filtroNumero').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = new Date().toISOString().split('T')[0];
    document.getElementById('filtroTipoVenta').value = '';
    document.getElementById('filtroEstado').value = '1';
    
    filtrosActivos = {};
    cargarFacturas();
}

// ======================
// RENDERIZAR TABLA
// ======================

function renderizarTablaFacturas(facturas) {
    const tbody = document.getElementById('facturasTableBody');
    
    if (!tbody) return;
    
    if (facturas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">No se encontraron facturas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = facturas.map(factura => {
        const estado = parseInt(factura.estado);
        const estadoBadge = estado === 1 
            ? '<span class="badge bg-success">Activa</span>' 
            : '<span class="badge bg-danger">Anulada</span>';
        
        const tipoVenta = factura.tipo_venta === 'online' ? 'En Línea' : 'Física';
        const tipoVentaBadge = factura.tipo_venta === 'online' 
            ? '<span class="badge bg-info">En Línea</span>' 
            : '<span class="badge bg-primary">Física</span>';
        
        return `
            <tr>
                <td><strong>${factura.numero_factura}</strong></td>
                <td>${formatearFecha(factura.fecha_emision || factura.created_at)}</td>
                <td>${factura.cliente_nombre || 'N/A'}</td>
                <td>${factura.cliente_nit || 'CF'}</td>
                <td>${tipoVentaBadge}</td>
                <td><strong class="text-success">${formatearPrecio(factura.total)}</strong></td>
                <td>${estadoBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" 
                                onclick="verDetalleFactura('${factura.numero_factura}')"
                                title="Ver Detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" 
                                onclick="imprimirFactura('${factura.numero_factura}')"
                                title="Imprimir">
                            <i class="bi bi-printer"></i>
                        </button>
                        ${estado === 1 ? `
                            <button class="btn btn-outline-danger" 
                                    onclick="anularFactura('${factura.numero_factura}')"
                                    title="Anular">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ======================
// ACTUALIZAR RESUMEN
// ======================

function actualizarResumen(facturas) {
    // Total facturas
    document.getElementById('totalFacturas').textContent = facturas.length;
    
    // Total ventas
    const totalVentas = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    document.getElementById('totalVentas').textContent = formatearPrecio(totalVentas);
    
    // Ventas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = facturas
        .filter(f => {
            const fechaFactura = new Date(f.fecha_emision || f.created_at).toISOString().split('T')[0];
            return fechaFactura === hoy;
        })
        .reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    document.getElementById('ventasHoy').textContent = formatearPrecio(ventasHoy);
    
    // Promedio por venta
    const promedio = facturas.length > 0 ? totalVentas / facturas.length : 0;
    document.getElementById('promedioVenta').textContent = formatearPrecio(promedio);
}

// ======================
// ACCIONES
// ======================

function verDetalleFactura(numeroFactura) {
    // Abrir modal o nueva vista con detalles
    window.open(`factura-print.html?numero=${numeroFactura}`, '_blank');
}

function imprimirFactura(numeroFactura) {
    window.open(`factura-print.html?numero=${numeroFactura}`, '_blank');
}

async function anularFactura(numeroFactura) {
    if (!confirm(`¿Estás seguro de anular la factura ${numeroFactura}?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    const motivo = prompt('Motivo de anulación:');
    
    if (!motivo) {
        mostrarError('Debes proporcionar un motivo para anular la factura');
        return;
    }
    
    try {
        const resultado = await anularFacturaAPI(numeroFactura, {
            motivo_anulacion: motivo
        });
        
        if (resultado.success) {
            mostrarExito('Factura anulada correctamente');
            cargarFacturas();
        } else {
            throw new Error(resultado.message || 'Error al anular la factura');
        }
    } catch (error) {
        console.error('Error anulando factura:', error);
        mostrarError(error.message || 'Error al anular la factura');
    }
}

// ======================
// FUNCIONES API (si no existen en api.js)
// ======================

async function anularFacturaAPI(numeroFactura, datos) {
    return await fetchAPI(`/facturas/${numeroFactura}/anular`, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}