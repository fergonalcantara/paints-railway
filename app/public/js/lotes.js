/**
 * lotes.js - Gestión de Lotes de Inventario
 * Registrar compras y asignar a sucursales
 */

// Variables globales
let productos = [];
let proveedores = [];
let sucursales = [];
let lotesActuales = [];
let cantidadTotalLote = 0;
let distribucionSucursales = {};

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando módulo de lotes...');
    
    try {
        await esperarLayoutListo();
        
        // Cargar datos iniciales
        await Promise.all([
            cargarProductos(),
            cargarProveedores(),
            cargarSucursales()
        ]);
        
        // Configurar fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso) fechaIngreso.value = hoy;
        
        console.log('✅ Lotes inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar lotes');
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
// CARGAR DATOS INICIALES
// ======================

async function cargarProductos() {
    try {
        const resultado = await obtenerProductos({ limit: 1000 });
        
        if (resultado.success && Array.isArray(resultado.data)) {
            productos = resultado.data;
            
            // Llenar select de producto en modal
            const selectModal = document.getElementById('productoLote');
            if (selectModal) {
                selectModal.innerHTML = '<option value="">Seleccione...</option>';
                productos.forEach(producto => {
                    selectModal.innerHTML += `
                        <option value="${producto.id}" data-nombre="${producto.nombre}">
                            ${producto.sku} - ${producto.nombre}
                        </option>
                    `;
                });
            }
            
            // Llenar select de búsqueda
            const selectBusqueda = document.getElementById('productoSelect');
            if (selectBusqueda) {
                selectBusqueda.innerHTML = '<option value="">Seleccione un producto...</option>';
                productos.forEach(producto => {
                    selectBusqueda.innerHTML += `
                        <option value="${producto.id}">
                            ${producto.sku} - ${producto.nombre}
                        </option>
                    `;
                });
            }
            
            console.log(`✅ ${productos.length} productos cargados`);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

async function cargarProveedores() {
    try {
        const resultado = await obtenerProveedores({ limit: 1000 });
        
        if (resultado.success && Array.isArray(resultado.data)) {
            proveedores = resultado.data;
            
            // Llenar select en modal
            const selectModal = document.getElementById('proveedorLote');
            if (selectModal) {
                selectModal.innerHTML = '<option value="">Seleccione...</option>';
                proveedores.forEach(proveedor => {
                    selectModal.innerHTML += `
                        <option value="${proveedor.id}">
                            ${proveedor.nombre_comercial} (${proveedor.nit})
                        </option>
                    `;
                });
            }
            
            // Llenar filtro
            const filtroProveedor = document.getElementById('filtroProveedor');
            if (filtroProveedor) {
                filtroProveedor.innerHTML = '<option value="">Todos</option>';
                proveedores.forEach(proveedor => {
                    filtroProveedor.innerHTML += `
                        <option value="${proveedor.id}">${proveedor.nombre_comercial}</option>
                    `;
                });
            }
            
            console.log(`✅ ${proveedores.length} proveedores cargados`);
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

async function cargarSucursales() {
    try {
        const resultado = await obtenerSucursales();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            sucursales = resultado.data;
            console.log(`✅ ${sucursales.length} sucursales cargadas`);
        }
    } catch (error) {
        console.error('Error cargando sucursales:', error);
    }
}

// ======================
// CARGAR LOTES DE PRODUCTO
// ======================

async function cargarLotesDeProducto() {
    const productoId = document.getElementById('productoSelect')?.value;
    
    if (!productoId) {
        document.getElementById('lotesContainer').innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-boxes" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-3">Seleccione un producto para ver sus lotes</p>
            </div>
        `;
        document.getElementById('totalLotesInfo').textContent = 'Seleccione un producto';
        return;
    }
    
    try {
        const resultado = await obtenerLotesDeProducto(productoId);
        
        if (resultado.success && Array.isArray(resultado.data)) {
            lotesActuales = resultado.data;
            renderizarLotes(lotesActuales);
            
            // ✅ CALCULAR CORRECTAMENTE
            const totalLotes = lotesActuales.length;
            const totalUnidades = lotesActuales.reduce((sum, lote) => {
                const cantidad = parseInt(lote.cantidad_total) || 0;  // ✅ Asegurar que sea número
                return sum + cantidad;
            }, 0);
            
            document.getElementById('totalLotesInfo').textContent = 
                `${totalLotes} lote${totalLotes !== 1 ? 's' : ''} (${totalUnidades} unidades totales)`;
        } else {
            renderizarLotes([]);
            document.getElementById('totalLotesInfo').textContent = '0 lotes';
        }
    } catch (error) {
        console.error('Error cargando lotes:', error);
        mostrarError('Error al cargar lotes del producto');
        document.getElementById('totalLotesInfo').textContent = 'Error al cargar';
    }
}

function renderizarLotes(lotes) {
    const container = document.getElementById('lotesContainer');
    
    if (!container) return;
    
    if (lotes.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-3">No hay lotes registrados para este producto</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lotes.map(lote => {
        const proveedor = lote.proveedor || {};
        const distribuciones = lote.distribuciones || [];
        
        // Calcular estado del lote
        const cantidadTotal = lote.cantidad_total || 0;
        const cantidadDisponible = lote.cantidad_disponible || 0;
        const cantidadDistribuida = cantidadTotal - cantidadDisponible;
        const porcentajeDistribuido = cantidadTotal > 0 ? (cantidadDistribuida / cantidadTotal) * 100 : 0;
        
        // ✅ Usar precio_compra_unidad (nombre correcto)
        const precioCompra = lote.precio_compra_unidad || 0;
        const costoTotal = lote.costo_total || (cantidadTotal * precioCompra);
        
        return `
            <div class="col-md-6 mb-4">
                <div class="card lote-card">
                    <div class="lote-header">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">
                                    <i class="bi bi-box-seam me-2"></i>${lote.codigo_lote || 'Sin código'}
                                </h6>
                                <small class="text-muted">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    ${formatearFecha(lote.fecha_ingreso)}
                                </small>
                            </div>
                            <div class="text-end">
                                <div class="cantidad-badge">${cantidadTotal} unidades</div>
                                <small class="d-block mt-1 ${cantidadDisponible > 0 ? 'text-success' : 'text-muted'}">
                                    ${cantidadDisponible > 0 ? `${cantidadDisponible} disponibles` : 'Totalmente distribuido'}
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="mb-3">
                            <small class="text-muted d-block">Proveedor</small>
                            <strong>${proveedor.nombre_comercial || 'N/A'}</strong>
                            ${proveedor.nit ? `<br><small class="text-muted">NIT: ${proveedor.nit}</small>` : ''}
                        </div>
                        
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted d-block">Precio Compra</small>
                                <strong class="text-success">${formatearPrecio(precioCompra)}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Costo Total</small>
                                <strong class="text-primary">${formatearPrecio(costoTotal)}</strong>
                            </div>
                        </div>
                        
                        ${lote.numero_factura_proveedor ? `
                            <div class="mb-3">
                                <small class="text-muted d-block">N° Factura Proveedor</small>
                                <code>${lote.numero_factura_proveedor}</code>
                            </div>
                        ` : ''}
                        
                        <!-- Barra de progreso de distribución -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">Distribución</small>
                                <small class="text-muted">${porcentajeDistribuido.toFixed(0)}%</small>
                            </div>
                            <div class="stock-progress">
                                <div class="stock-progress-fill ok" style="width: ${porcentajeDistribuido}%"></div>
                            </div>
                        </div>
                        
                        ${distribuciones.length > 0 ? `
                            <div class="mt-3">
                                <small class="text-muted d-block mb-2">
                                    <i class="bi bi-building me-1"></i>Distribución en Sucursales
                                </small>
                                ${distribuciones.map(dist => {
                                    const sucursal = dist.inventario?.sucursal;
                                    return `
                                        <div class="distribucion-item">
                                            <span>
                                                <i class="bi bi-shop me-2"></i>
                                                ${sucursal?.nombre || 'N/A'}
                                            </span>
                                            <span class="badge bg-primary">${dist.cantidad_asignada || 0} unidades</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-warning mb-0">
                                <small><i class="bi bi-exclamation-triangle me-2"></i>Lote sin distribuir</small>
                            </div>
                        `}
                    </div>
                    
                    <div class="card-footer bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            ${cantidadDisponible > 0 ? `
                                <button class="btn btn-sm btn-primary" onclick="abrirModalDistribuir(${lote.id}, ${cantidadDisponible}, ${lote.producto_id})">
                                    <i class="bi bi-boxes me-1"></i>Distribuir (${cantidadDisponible})
                                </button>
        ` : ''}
    </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ======================
// REGISTRAR NUEVO LOTE
// ======================

function abrirModalRegistrarLote() {
    try {
        // Resetear formulario
        const form = document.getElementById('formRegistrarLote');
        if (form) form.reset();
        
        // Establecer fecha de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso) fechaIngreso.value = hoy;
        
        // Generar código automático
        const codigo = `LOT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const codigoLote = document.getElementById('codigoLote');
        if (codigoLote) codigoLote.value = codigo;
        
        // Resetear distribución
        distribucionSucursales = {};
        cantidadTotalLote = 0;
        
        // Limpiar distribución
        const distribucionContainer = document.getElementById('distribucionSucursales');
        if (distribucionContainer) {
            distribucionContainer.innerHTML = '<p class="text-muted text-center py-3">Primero ingrese la cantidad total</p>';
        }
        
        // Resetear resumen
        actualizarResumenCostos();
        
        const modalElement = document.getElementById('modalRegistrarLote');
        if (!modalElement) {
            console.error('❌ Modal #modalRegistrarLote no encontrado');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        console.log('✅ Modal de registrar lote abierto');
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
        mostrarError('Error al abrir el formulario');
    }
}

function calcularCostoTotal() {
    const cantidad = parseFloat(document.getElementById('cantidadTotal')?.value) || 0;
    const precioUnitario = parseFloat(document.getElementById('precioCompraUnidad')?.value) || 0;
    
    cantidadTotalLote = cantidad;
    
    // Generar campos de distribución si hay cantidad
    if (cantidad > 0) {
        generarCamposDistribucion();
    }
    
    actualizarResumenCostos();
}

function generarCamposDistribucion() {
    const container = document.getElementById('distribucionSucursales');
    
    if (!container || sucursales.length === 0) return;
    
    // Resetear distribución
    if (Object.keys(distribucionSucursales).length === 0) {
        sucursales.forEach(sucursal => {
            distribucionSucursales[sucursal.id] = 0;
        });
    }
    
    container.innerHTML = sucursales.map(sucursal => `
        <div class="distribucion-item">
            <div class="d-flex align-items-center">
                <i class="bi bi-building me-2 text-primary"></i>
                <strong>${sucursal.nombre}</strong>
                <small class="text-muted ms-2">${sucursal.direccion}</small>
            </div>
            <input type="number" 
                   class="form-control cantidad-input" 
                   id="dist_${sucursal.id}"
                   min="0" 
                   max="${cantidadTotalLote}"
                   value="${distribucionSucursales[sucursal.id] || 0}"
                   onchange="actualizarDistribucion(${sucursal.id}, this.value)"
                   placeholder="0">
        </div>
    `).join('');
}

function actualizarDistribucion(sucursalId, cantidad) {
    distribucionSucursales[sucursalId] = parseInt(cantidad) || 0;
    
    // Calcular cantidad asignada
    const totalAsignado = Object.values(distribucionSucursales).reduce((sum, cant) => sum + cant, 0);
    const restante = cantidadTotalLote - totalAsignado;
    
    const badge = document.getElementById('cantidadRestante');
    if (badge) {
        badge.textContent = `${restante} unidades disponibles`;
        badge.className = restante === 0 ? 'badge bg-success ms-2' : 'badge bg-warning ms-2';
    }
}

function actualizarResumenCostos() {
    const cantidad = parseFloat(document.getElementById('cantidadTotal')?.value) || 0;
    const precioUnitario = parseFloat(document.getElementById('precioCompraUnidad')?.value) || 0;
    
    const costoTotal = cantidad * precioUnitario;
    
    const costoTotalElement = document.getElementById('costoTotal');
    const costoPromedioElement = document.getElementById('costoPromedio');
    
    if (costoTotalElement) {
        costoTotalElement.textContent = formatearPrecio(costoTotal);
    }
    
    if (costoPromedioElement) {
        costoPromedioElement.textContent = formatearPrecio(precioUnitario);
    }
}

async function guardarLote() {
    try {
        // Validar campos obligatorios
        const codigo = document.getElementById('codigoLote')?.value.trim();
        const proveedorId = parseInt(document.getElementById('proveedorLote')?.value);
        const productoId = parseInt(document.getElementById('productoLote')?.value);
        const fechaIngreso = document.getElementById('fechaIngreso')?.value;
        const cantidad = parseInt(document.getElementById('cantidadTotal')?.value);
        const precioCompra = parseFloat(document.getElementById('precioCompraUnidad')?.value);
        const numeroFactura = document.getElementById('numeroFacturaProveedor')?.value.trim();
        
        if (!codigo || !proveedorId || !productoId || !fechaIngreso || !cantidad || !precioCompra) {
            mostrarError('Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (cantidad <= 0) {
            mostrarError('La cantidad debe ser mayor a 0');
            return;
        }
        
        if (precioCompra <= 0) {
            mostrarError('El precio de compra debe ser mayor a 0');
            return;
        }
        
        // ✅ Calcular distribución (puede ser parcial o cero)
        const totalAsignado = Object.values(distribucionSucursales).reduce((sum, cant) => sum + cant, 0);
        
        // ✅ Validar que NO se asigne MÁS de lo disponible (pero puede ser menos o cero)
        if (totalAsignado > cantidad) {
            mostrarError(`No puedes distribuir más de ${cantidad} unidades. Asignadas: ${totalAsignado}`);
            return;
        }
        
        // ✅ Preparar distribuciones (puede estar vacío)
        const distribucionesConInventarioId = [];
        
        if (totalAsignado > 0) {
            for (const [sucursalId, cantidadAsignada] of Object.entries(distribucionSucursales)) {
                if (cantidadAsignada > 0) {
                    // Buscar o crear inventario para esta combinación sucursal-producto
                    try {
                        const inventarioResponse = await fetch('/api/inventario', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                sucursal_id: parseInt(sucursalId),
                                producto_id: productoId,
                                stock_minimo: 5,
                                stock_maximo: 1000
                            })
                        });
                        
                        const inventarioData = await inventarioResponse.json();
                        
                        if (!inventarioData.success) {
                            throw new Error(`Error al crear inventario para sucursal ${sucursalId}`);
                        }
                        
                        distribucionesConInventarioId.push({
                            inventario_id: inventarioData.data.id,
                            cantidad: cantidadAsignada
                        });
                    } catch (error) {
                        console.error('Error creando inventario:', error);
                        throw new Error('Error al preparar la distribución');
                    }
                }
            }
        }
        
        // ✅ Preparar datos del lote
        const datos = {
            codigo_lote: codigo,
            proveedor_id: proveedorId,
            producto_id: productoId,
            fecha_ingreso: fechaIngreso,
            cantidad_total: cantidad,
            precio_compra_unidad: precioCompra,
            numero_factura_proveedor: numeroFactura || null,
            distribuciones: distribucionesConInventarioId // ✅ Puede estar vacío []
        };
        
        console.log('📤 Enviando lote:', datos);
        
        // Confirmar si no hay distribución
        if (distribucionesConInventarioId.length === 0) {
            if (!confirm(`No has distribuido ninguna unidad.\n\nEl lote quedará con ${cantidad} unidades disponibles para distribuir después.\n\n¿Continuar?`)) {
                return;
            }
        } else if (totalAsignado < cantidad) {
            const restante = cantidad - totalAsignado;
            if (!confirm(`Has distribuido ${totalAsignado} de ${cantidad} unidades.\n\nQuedarán ${restante} unidades disponibles para distribuir después.\n\n¿Continuar?`)) {
                return;
            }
        }
        
        const resultado = await registrarLote(datos);
        
        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al registrar lote');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarLote'));
        if (modal) modal.hide();
        
        mostrarExito(resultado.message || 'Lote registrado exitosamente');
        
        // Recargar lotes si hay un producto seleccionado
        const productoSelect = document.getElementById('productoSelect');
        if (productoSelect && productoSelect.value) {
            await cargarLotesDeProducto();
        }
        
    } catch (error) {
        console.error('❌ Error guardando lote:', error);
        mostrarError(error.message || 'Error al guardar el lote');
    }
}


// ======================
// BÚSQUEDA Y FILTROS
// ======================

function buscarProductoLote() {
    // Implementar búsqueda si es necesario
    console.log('Búsqueda de producto en lotes');
}

function aplicarFiltrosLotes() {
    // Implementar filtros si es necesario
    console.log('Aplicando filtros de lotes');
}

// Variables para distribución de lote existente
let loteADistribuir = null;
let cantidadDisponibleLote = 0;
let distribucionLoteExistente = {};

function abrirModalDistribuir(loteId, cantidadDisponible, productoId) {
    loteADistribuir = loteId;
    cantidadDisponibleLote = cantidadDisponible;
    distribucionLoteExistente = {};
    
    // Resetear distribución
    sucursales.forEach(sucursal => {
        distribucionLoteExistente[sucursal.id] = 0;
    });
    
    // Actualizar info
    document.getElementById('loteIdDistribuir').value = loteId;
    document.getElementById('productoIdDistribuir').value = productoId;
    document.getElementById('cantidadDisponibleText').textContent = `${cantidadDisponible} unidades disponibles`;
    document.getElementById('cantidadRestanteDistribuir').textContent = `${cantidadDisponible} unidades por asignar`;
    
    // Generar campos
    const container = document.getElementById('distribucionSucursalesExistente');
    container.innerHTML = sucursales.map(sucursal => `
        <div class="distribucion-item">
            <div class="d-flex align-items-center">
                <i class="bi bi-building me-2 text-primary"></i>
                <strong>${sucursal.nombre}</strong>
                <small class="text-muted ms-2">${sucursal.direccion}</small>
            </div>
            <input type="number" 
                   class="form-control cantidad-input" 
                   id="distEx_${sucursal.id}"
                   min="0" 
                   max="${cantidadDisponible}"
                   value="0"
                   onchange="actualizarDistribucionExistente(${sucursal.id}, this.value)"
                   placeholder="0">
        </div>
    `).join('');
    
    const modal = new bootstrap.Modal(document.getElementById('modalDistribuirLote'));
    modal.show();
}

function actualizarDistribucionExistente(sucursalId, cantidad) {
    distribucionLoteExistente[sucursalId] = parseInt(cantidad) || 0;
    
    const totalAsignado = Object.values(distribucionLoteExistente).reduce((sum, cant) => sum + cant, 0);
    const restante = cantidadDisponibleLote - totalAsignado;
    
    const badge = document.getElementById('cantidadRestanteDistribuir');
    if (badge) {
        badge.textContent = `${restante} unidades por asignar`;
        badge.className = restante === 0 ? 'badge bg-success' : 'badge bg-info';
    }
}

async function guardarDistribucionLote() {
    try {
        const loteId = parseInt(document.getElementById('loteIdDistribuir').value);
        const productoId = parseInt(document.getElementById('productoIdDistribuir').value);
        
        const totalAsignado = Object.values(distribucionLoteExistente).reduce((sum, cant) => sum + cant, 0);
        
        if (totalAsignado === 0) {
            mostrarError('Debes asignar al menos 1 unidad a alguna sucursal');
            return;
        }
        
        if (totalAsignado > cantidadDisponibleLote) {
            mostrarError(`No puedes distribuir más de ${cantidadDisponibleLote} unidades`);
            return;
        }
        
        // Preparar distribuciones
        const distribuciones = Object.entries(distribucionLoteExistente)
            .filter(([_, cant]) => cant > 0)
            .map(([sucursalId, cant]) => ({
                sucursal_id: parseInt(sucursalId),
                cantidad: cant
            }));
        
        const datos = {
            lote_id: loteId,
            distribuciones
        };
        
        console.log('📤 Distribuyendo lote:', datos);
        
        const resultado = await distribuirLoteExistente(datos);
        
        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al distribuir');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDistribuirLote'));
        if (modal) modal.hide();
        
        mostrarExito(resultado.message || 'Lote distribuido exitosamente');
        
        // Recargar lotes
        await cargarLotesDeProducto();
        
    } catch (error) {
        console.error('❌ Error distribuyendo lote:', error);
        mostrarError(error.message || 'Error al distribuir el lote');
    }
}