/**
 * inventario.js - Gestión de Inventarios por Sucursal
 * Ver stock, ajustar niveles mínimos/máximos
 */

// Variables globales
let sucursales = [];
let inventarioActual = [];
let sucursalSeleccionada = null;
let paginaActual = 1;
let totalPaginas = 1;
const LIMITE_POR_PAGINA = 20;

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando módulo de inventario...');
    
    try {
        await esperarLayoutListo();
        
        // Cargar sucursales
        await cargarSucursales();
        
        console.log('✅ Inventario inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar inventario');
    }
});

function esperarLayoutListo() {
    return new Promise((resolve) => {
        if (typeof usuarioActual !== 'undefined' && usuarioActual) {
            resolve();
        } else {
            let intentos = 0;
            const intervalo = setInterval(() => {
                if (typeof usuarioActual !== 'undefined' && usuarioActual) {
                    clearInterval(intervalo);
                    resolve();
                } else if (intentos++ > 50) {
                    clearInterval(intervalo);
                    resolve();
                }
            }, 100);
        }
    });
}

// ======================
// CARGAR SUCURSALES
// ======================

async function cargarSucursales() {
    try {
        const resultado = await obtenerSucursales();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            sucursales = resultado.data;
            
            const select = document.getElementById('sucursalSelect');
            if (select) {
                select.innerHTML = '<option value="">Seleccione una sucursal...</option>';
                sucursales.forEach(sucursal => {
                    select.innerHTML += `
                        <option value="${sucursal.id}">
                            ${sucursal.nombre} - ${sucursal.direccion}
                        </option>
                    `;
                });
            }
            
            console.log(`✅ ${sucursales.length} sucursales cargadas`);
        }
    } catch (error) {
        console.error('Error cargando sucursales:', error);
    }
}

// ======================
// CARGAR INVENTARIO
// ======================

async function cargarInventarioSucursal(pagina = 1) {
    const sucursalId = document.getElementById('sucursalSelect')?.value;
    
    if (!sucursalId) {
        mostrarInventarioVacio();
        return;
    }
    
    try {
        sucursalSeleccionada = parseInt(sucursalId);
        paginaActual = pagina;
        
        const params = {
            page: pagina,
            limit: LIMITE_POR_PAGINA
        };
        
        // Agregar filtros
        const buscar = document.getElementById('buscarProductoInventario')?.value.trim();
        if (buscar) params.buscar = buscar;
        
        const filtroStock = document.getElementById('filtroStock')?.value;
        if (filtroStock === 'bajo' || filtroStock === 'critico') {
            params.bajo_stock = 'true';
        }
        
        const resultado = await obtenerInventarioPorSucursal(sucursalId, params);
        
        if (resultado.success && Array.isArray(resultado.data)) {
            inventarioActual = resultado.data;
            renderizarInventario(resultado.data);
            
            // Actualizar estadísticas
            if (resultado.pagination) {
                totalPaginas = resultado.pagination.totalPages;
                document.getElementById('totalProductosInventario').textContent = resultado.pagination.total;
                
                // Contar bajo stock
                const bajoStock = resultado.data.filter(inv => inv.stock_actual < inv.stock_minimo).length;
                document.getElementById('productosBajoStock').textContent = bajoStock;
            }
            
            console.log(`✅ ${resultado.data.length} productos en inventario`);
        } else {
            renderizarInventario([]);
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
        mostrarError('Error al cargar el inventario');
        mostrarInventarioVacio();
    }
}

function mostrarInventarioVacio() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5">
                <i class="bi bi-building" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-3">Seleccione una sucursal para ver el inventario</p>
            </td>
        </tr>
    `;
    
    document.getElementById('totalProductosInventario').textContent = '0';
    document.getElementById('productosBajoStock').textContent = '0';
}

function renderizarInventario(inventario) {
    const tbody = document.getElementById('inventarioTableBody');
    
    if (!tbody) return;
    
    if (inventario.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p class="mt-3 mb-0">No hay productos en el inventario de esta sucursal</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inventario.map(item => {
        const producto = item.producto || {};
        const stockActual = item.stock_actual || 0;
        const stockMinimo = item.stock_minimo || 0;
        const stockMaximo = item.stock_maximo || 0;
        
        // Calcular estado del stock
        let estadoStock = 'ok';
        let estadoTexto = 'Normal';
        let estadoClase = 'stock-ok';
        
        if (stockActual === 0) {
            estadoStock = 'critico';
            estadoTexto = 'Sin Stock';
            estadoClase = 'stock-critico';
        } else if (stockActual < stockMinimo) {
            estadoStock = 'critico';
            estadoTexto = 'Crítico';
            estadoClase = 'stock-critico';
        } else if (stockActual <= stockMinimo * 1.2) {
            estadoStock = 'bajo';
            estadoTexto = 'Bajo';
            estadoClase = 'stock-bajo';
        }
        
        // Calcular porcentaje de llenado
        const porcentaje = stockMaximo > 0 ? (stockActual / stockMaximo) * 100 : 0;
        
        return `
            <tr>
                <td><code>${producto.sku || 'N/A'}</code></td>
                <td>
                    <strong>${producto.nombre || 'Sin nombre'}</strong>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2 ${estadoClase}">${stockActual}</span>
                        <div class="stock-progress" style="width: 80px;">
                            <div class="stock-progress-fill ${estadoStock}" 
                                 style="width: ${Math.min(porcentaje, 100)}%">
                            </div>
                        </div>
                    </div>
                </td>
                <td>${stockMinimo}</td>
                <td>${stockMaximo}</td>
                <td>
                    <span class="badge ${
                        estadoStock === 'ok' ? 'bg-success' : 
                        estadoStock === 'bajo' ? 'bg-warning' : 'bg-danger'
                    }">
                        ${estadoTexto}
                    </span>
                </td>
                <td class="table-actions text-center">
                    <button class="btn btn-sm btn-primary" 
                            onclick="abrirModalAjustarStock(${item.id}, ${item.producto_id})"
                            title="Ajustar stock mínimo/máximo">
                        <i class="bi bi-sliders"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ======================
// AJUSTAR STOCK
// ======================

function abrirModalAjustarStock(inventarioId, productoId) {
    try {
        const inventario = inventarioActual.find(inv => inv.id === inventarioId);
        
        if (!inventario) {
            mostrarError('No se encontró el inventario');
            return;
        }
        
        // Llenar formulario
        document.getElementById('inventarioId').value = inventarioId;
        document.getElementById('productoIdAjuste').value = productoId;
        document.getElementById('productoNombreAjuste').textContent = inventario.producto?.nombre || 'N/A';
        document.getElementById('stockMinimo').value = inventario.stock_minimo || 0;
        document.getElementById('stockMaximo').value = inventario.stock_maximo || 0;
        
        const modalElement = document.getElementById('modalAjustarStock');
        if (!modalElement) {
            console.error('❌ Modal #modalAjustarStock no encontrado');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        console.log('✅ Modal de ajustar stock abierto');
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
        mostrarError('Error al abrir el formulario');
    }
}

async function guardarAjusteStock() {
    try {
        const inventarioId = parseInt(document.getElementById('inventarioId')?.value);
        const stockMinimo = parseInt(document.getElementById('stockMinimo')?.value);
        const stockMaximo = parseInt(document.getElementById('stockMaximo')?.value);
        
        if (!inventarioId || isNaN(stockMinimo) || isNaN(stockMaximo)) {
            mostrarError('Por favor completa todos los campos');
            return;
        }
        
        if (stockMinimo < 0 || stockMaximo < 0) {
            mostrarError('Los valores deben ser mayores o iguales a 0');
            return;
        }
        
        if (stockMinimo > stockMaximo) {
            mostrarError('El stock mínimo no puede ser mayor al máximo');
            return;
        }
        
        const datos = {
            inventario_id: inventarioId,
            stock_minimo: stockMinimo,
            stock_maximo: stockMaximo
        };
        
        const resultado = await actualizarInventario(datos);
        
        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al actualizar inventario');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAjustarStock'));
        if (modal) modal.hide();
        
        mostrarExito('Stock actualizado exitosamente');
        
        // Recargar inventario
        await cargarInventarioSucursal(paginaActual);
        
    } catch (error) {
        console.error('❌ Error guardando ajuste:', error);
        mostrarError(error.message || 'Error al guardar los cambios');
    }
}

// ======================
// BÚSQUEDA Y FILTROS
// ======================

function buscarEnInventario() {
    const termino = document.getElementById('buscarProductoInventario')?.value.trim();
    
    if (termino.length === 0 || termino.length >= 3) {
        cargarInventarioSucursal(1);
    }
}

function aplicarFiltrosInventario() {
    cargarInventarioSucursal(1);
}

// ======================
// PAGINACIÓN
// ======================

function cambiarPaginaInventario(pagina) {
    if (pagina < 1 || pagina > totalPaginas) return;
    cargarInventarioSucursal(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}