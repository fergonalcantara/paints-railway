/**
 * reportes.js - Gestión de Reportes del Sistema
 * Utiliza los 10 procedimientos almacenados
 */

// ======================
// INICIALIZACIÓN
// ======================

// Usar la misma constante que api.js
const API_URL = API_BASE_URL || 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando módulo de reportes...');
    
    try {
        // Cargar sucursales para el reporte 10
        await cargarSucursales();
        
        console.log('Módulo de reportes inicializado');
    } catch (error) {
        console.error('Error al inicializar reportes:', error);
    }
});

// ======================
// REPORTE 1: FACTURACIÓN POR MÉTODO DE PAGO
// ======================

async function generarReporte1() {
    const fechaInicio = document.getElementById('r1FechaInicio').value;
    const fechaFin = document.getElementById('r1FechaFin').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarError('Debe seleccionar ambas fechas');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/facturacion-metodo-pago?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte1');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        No hay datos en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => `
            <tr>
                <td><strong>${item.metodo_pago || 'N/A'}</strong></td>
                <td>${item.cantidad_facturas || 0}</td>
                <td><strong class="text-success">${formatearPrecio(item.total_facturado || 0)}</strong></td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 1:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 2: PRODUCTOS QUE MÁS INGRESOS GENERAN
// ======================

async function generarReporte2() {
    const fechaInicio = document.getElementById('r2FechaInicio').value;
    const fechaFin = document.getElementById('r2FechaFin').value;
    const limite = document.getElementById('r2Limite').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarError('Debe seleccionar ambas fechas');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/productos-mas-ingresos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=${limite}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte2');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay datos en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map((item, index) => `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td>${item.total_vendido || 0}</td>
                <td><strong class="text-success">${formatearPrecio(item.total_ingresos || 0)}</strong></td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 2:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 3: PRODUCTOS MÁS VENDIDOS
// ======================

async function generarReporte3() {
    const fechaInicio = document.getElementById('r3FechaInicio').value;
    const fechaFin = document.getElementById('r3FechaFin').value;
    const limite = document.getElementById('r3Limite').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarError('Debe seleccionar ambas fechas');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/productos-mas-vendidos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=${limite}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte3');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay datos en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map((item, index) => `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td><strong>${item.total_vendido || 0}</strong></td>
                <td class="text-success">${formatearPrecio(item.total_ingresos || 0)}</td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 3:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 4: INVENTARIO GENERAL
// ======================

async function generarReporte4() {
    try {
        const response = await fetch(`${API_URL}/reportes/inventario-general`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte4');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        No hay datos de inventario
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => {
            const stockBajo = item.stock_actual <= item.stock_minimo;
            const estadoClass = stockBajo ? 'text-danger' : 'text-success';
            const estadoTexto = stockBajo ? 'BAJO' : 'OK';
            
            return `
                <tr>
                    <td>${item.producto_nombre || 'N/A'}</td>
                    <td>${item.categoria_nombre || 'N/A'}</td>
                    <td>${item.sucursal_nombre || 'N/A'}</td>
                    <td><strong>${item.stock_actual || 0}</strong></td>
                    <td>${item.stock_minimo || 0}</td>
                    <td><span class="badge ${stockBajo ? 'bg-danger' : 'bg-success'}">${estadoTexto}</span></td>
                </tr>
            `;
        }).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 4:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 5: PRODUCTOS MENOS VENDIDOS
// ======================

async function generarReporte5() {
    const fechaInicio = document.getElementById('r5FechaInicio').value;
    const fechaFin = document.getElementById('r5FechaFin').value;
    const limite = document.getElementById('r5Limite').value;

    if (!fechaInicio || !fechaFin) {
        mostrarError('Debe seleccionar ambas fechas');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reportes/productos-menos-vendidos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=${limite}`, {
            credentials: 'include'
        });

        const resultado = await response.json();

        if (!resultado.success) {
            throw new Error(resultado.message);
        }

        const tbody = document.getElementById('tablaReporte5');

        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay datos en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = resultado.data.map((item, index) => `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td>${item.total_vendido || 0}</td>
                <td>${formatearPrecio(item.total_ingresos || 0)}</td>
            </tr>
        `).join('');

        mostrarExito('Reporte generado correctamente');

    } catch (error) {
        console.error('Error generando reporte 5:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 6: PRODUCTOS SIN STOCK
// ======================

async function generarReporte6() {
    try {
        const response = await fetch(`${API_URL}/reportes/productos-sin-stock`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte6');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                        <p class="mt-2">No hay productos sin stock</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => `
            <tr>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td>${item.categoria_nombre || 'N/A'}</td>
                <td>${item.sucursal_nombre || 'N/A'}</td>
                <td><strong class="text-danger">0</strong></td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 6:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 7: DETALLE DE FACTURA
// ======================

async function generarReporte7() {
    const numeroFactura = document.getElementById('r7NumeroFactura').value.trim();
    
    if (!numeroFactura) {
        mostrarError('Debe ingresar un número de factura');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/detalle-factura/${numeroFactura}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const encabezado = resultado.data.encabezado;
        const productos = resultado.data.productos;
        const pagos = resultado.data.pagos;
        
        if (!encabezado) {
            document.getElementById('r7Encabezado').style.display = 'none';
            document.getElementById('r7NoEncontrado').style.display = 'block';
            return;
        }
        
        // Mostrar encabezado
        document.getElementById('r7Encabezado').style.display = 'block';
        document.getElementById('r7NoEncontrado').style.display = 'none';
        
        document.getElementById('r7NumFac').textContent = encabezado.numero_factura;
        document.getElementById('r7SerieCor').textContent = `${encabezado.serie}-${encabezado.correlativo}`;
        document.getElementById('r7Fecha').textContent = formatearFecha(encabezado.fecha_emision);
        document.getElementById('r7TipoVenta').textContent = encabezado.tipo_venta === 'online' ? 'En Línea' : 'Física';
        document.getElementById('r7Cliente').textContent = encabezado.cliente_nombre || 'N/A';
        document.getElementById('r7Nit').textContent = encabezado.cliente_nit || 'CF';
        document.getElementById('r7Cajero').textContent = encabezado.empleado_emite || 'N/A';
        
        const estadoBadge = encabezado.estado === 1 
            ? '<span class="badge bg-success">ACTIVA</span>' 
            : '<span class="badge bg-danger">ANULADA</span>';
        document.getElementById('r7Estado').innerHTML = estadoBadge;
        
        // Productos
        document.getElementById('r7Productos').innerHTML = productos.map(p => `
            <tr>
                <td>${p.producto_nombre || 'N/A'}</td>
                <td>${p.cantidad}</td>
                <td>${formatearPrecio(p.precio_unitario)}</td>
                <td>${formatearPrecio(p.subtotal)}</td>
            </tr>
        `).join('');
        
        // Totales
        document.getElementById('r7Subtotal').textContent = formatearPrecio(encabezado.subtotal);
        document.getElementById('r7Descuento').textContent = formatearPrecio(encabezado.descuento_total);
        document.getElementById('r7Total').textContent = formatearPrecio(encabezado.total);
        
        // Pagos
        document.getElementById('r7Pagos').innerHTML = pagos.map(p => `
            <tr>
                <td>${p.metodo_pago || 'N/A'}</td>
                <td>${formatearPrecio(p.monto)}</td>
                <td>${p.numero_referencia || '-'}</td>
            </tr>
        `).join('');
        
        mostrarExito('Factura cargada correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 7:', error);
        mostrarError('Error al buscar la factura: ' + error.message);
        document.getElementById('r7Encabezado').style.display = 'none';
        document.getElementById('r7NoEncontrado').style.display = 'block';
    }
}

// ======================
// REPORTE 8: INGRESOS AL INVENTARIO
// ======================

async function generarReporte8() {
    const fechaInicio = document.getElementById('r8FechaInicio').value;
    const fechaFin = document.getElementById('r8FechaFin').value;
    
    if (!fechaInicio || !fechaFin) {
        mostrarError('Debe seleccionar ambas fechas');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/ingresos-inventario?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte8');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No hay ingresos de inventario en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => `
            <tr>
                <td><strong>${item.codigo_lote || 'N/A'}</strong></td>
                <td>${formatearFecha(item.fecha_ingreso)}</td>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td>${item.proveedor_nombre || 'N/A'}</td>
                <td><strong>${item.cantidad_total || 0}</strong></td>
                <td>${formatearPrecio(item.precio_compra_unidad || 0)}</td>
                <td><strong class="text-primary">${formatearPrecio(item.costo_total || 0)}</strong></td>
                <td><small>${item.sucursales_asignadas || 'Sin asignar'}</small></td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 8:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 9: STOCK BAJO MÍNIMO
// ======================

async function generarReporte9() {
    try {
        const response = await fetch(`${API_URL}/reportes/stock-bajo-minimo`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte9');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                        <p class="mt-2">No hay productos con stock bajo</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => {
            const diferencia = item.stock_minimo - item.stock_actual;
            return `
                <tr>
                    <td>${item.producto_nombre || 'N/A'}</td>
                    <td>${item.categoria_nombre || 'N/A'}</td>
                    <td>${item.sucursal_nombre || 'N/A'}</td>
                    <td><strong class="text-danger">${item.stock_actual || 0}</strong></td>
                    <td>${item.stock_minimo || 0}</td>
                    <td><span class="badge bg-warning text-dark">-${diferencia}</span></td>
                </tr>
            `;
        }).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 9:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// REPORTE 10: INVENTARIO POR TIENDA
// ======================

async function generarReporte10() {
    const sucursalId = document.getElementById('r10Sucursal').value;
    
    if (!sucursalId) {
        mostrarError('Debe seleccionar una sucursal');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reportes/inventario-por-tienda/${sucursalId}`, {
            credentials: 'include'
        });
        
        const resultado = await response.json();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const tbody = document.getElementById('tablaReporte10');
        
        if (!resultado.data || resultado.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No hay inventario en esta sucursal
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = resultado.data.map(item => `
            <tr>
                <td>${item.producto_nombre || 'N/A'}</td>
                <td>${item.categoria_nombre || 'N/A'}</td>
                <td><strong>${item.stock_actual || 0}</strong></td>
                <td>${item.stock_minimo || 0}</td>
                <td>${item.stock_maximo || 0}</td>
            </tr>
        `).join('');
        
        mostrarExito('Reporte generado correctamente');
        
    } catch (error) {
        console.error('Error generando reporte 10:', error);
        mostrarError('Error al generar el reporte: ' + error.message);
    }
}

// ======================
// CARGAR SUCURSALES
// ======================

async function cargarSucursales() {
    try {
        // Usar la función de api.js
        const resultado = await obtenerSucursales();
        
        if (!resultado.success) {
            throw new Error(resultado.message);
        }
        
        const select = document.getElementById('r10Sucursal');
        
        if (!resultado.data || resultado.data.length === 0) {
            select.innerHTML = '<option value="">No hay sucursales disponibles</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Seleccione una sucursal</option>' +
            resultado.data.map(sucursal => 
                `<option value="${sucursal.id}">${sucursal.nombre}</option>`
            ).join('');
        
    } catch (error) {
        console.error('Error cargando sucursales:', error);
        document.getElementById('r10Sucursal').innerHTML = '<option value="">Error al cargar sucursales</option>';
    }
}

// ======================
// EXPORTAR REPORTES
// ======================

function exportarReporte(tipo, formato) {
    // Construir parámetros según el tipo
    let params = new URLSearchParams();
    
    switch(tipo) {
        case 'facturacion-metodo-pago':
            params.append('fecha_inicio', document.getElementById('r1FechaInicio').value);
            params.append('fecha_fin', document.getElementById('r1FechaFin').value);
            break;
            
        case 'productos-mas-ingresos':
            params.append('fecha_inicio', document.getElementById('r2FechaInicio').value);
            params.append('fecha_fin', document.getElementById('r2FechaFin').value);
            params.append('limite', document.getElementById('r2Limite').value);
            break;
            
        case 'productos-mas-vendidos':
            params.append('fecha_inicio', document.getElementById('r3FechaInicio').value);
            params.append('fecha_fin', document.getElementById('r3FechaFin').value);
            params.append('limite', document.getElementById('r3Limite').value);
            break;
            
        case 'inventario-general':
            // No requiere parámetros
            break;
            
        case 'productos-menos-vendidos':
            params.append('fecha_inicio', document.getElementById('r5FechaInicio').value);
            params.append('fecha_fin', document.getElementById('r5FechaFin').value);
            params.append('limite', document.getElementById('r5Limite').value);
            break;
            
        case 'productos-sin-stock':
            // No requiere parámetros
            break;
            
        case 'detalle-factura':
            params.append('numero_factura', document.getElementById('r7NumeroFactura').value);
            break;
            
        case 'ingresos-inventario':
            params.append('fecha_inicio', document.getElementById('r8FechaInicio').value);
            params.append('fecha_fin', document.getElementById('r8FechaFin').value);
            break;
            
        case 'stock-bajo-minimo':
            // No requiere parámetros
            break;
            
        case 'inventario-por-tienda':
            params.append('sucursal_id', document.getElementById('r10Sucursal').value);
            break;
    }
    
    // Abrir en nueva pestaña para descargar
    const url = `${API_URL}/reportes/exportar/${tipo}/${formato}?${params.toString()}`;
    window.open(url, '_blank');
}