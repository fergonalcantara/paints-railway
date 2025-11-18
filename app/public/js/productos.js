/**
 * productos.js - Gestión completa del CRUD de Productos
 * Usa api.js y depende de admin-layout.js para sesión
 */

// Variables globales
let paginaActual = 1;
let totalPaginas = 1;
const LIMITE_POR_PAGINA = 10;
let productosCache = [];
let categorias = [];
let marcas = [];
let unidadesMedida = [];
let colores = [];
let productoEditando = null;

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando módulo de productos...');
    
    try {
        // Esperar a que el layout esté listo
        await esperarLayoutListo();
        
        // Cargar datos de catálogos en paralelo
        await Promise.all([
            cargarCategorias(),
            cargarMarcas(),
            cargarUnidadesMedida(),
            cargarColores()
        ]);
        
        // Cargar productos
        await cargarProductos();
        
        // Configurar evento de búsqueda
        const buscarInput = document.getElementById('buscarInput');
        if (buscarInput) {
            buscarInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') buscarProductos();
            });
        }
        
        console.log('✅ Productos inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar productos');
    }
});

// Esperar a que admin-layout.js termine de cargar
function esperarLayoutListo() {
    return new Promise((resolve) => {
        if (typeof usuarioActual !== 'undefined' && usuarioActual) {
            console.log('✅ Layout ya listo');
            resolve();
        } else {
            let intentos = 0;
            const intervalo = setInterval(() => {
                if (typeof usuarioActual !== 'undefined' && usuarioActual) {
                    clearInterval(intervalo);
                    console.log('✅ Layout listo');
                    resolve();
                } else if (intentos++ > 50) {
                    clearInterval(intervalo);
                    console.warn('⚠️ Timeout esperando layout');
                    resolve();
                }
            }, 100);
        }
    });
}

// ======================
// CARGAR CATÁLOGOS
// ======================

async function cargarCategorias() {
    try {
        const resultado = await obtenerCategorias();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            categorias = resultado.data;
            
            // Llenar select de filtro (PUEDE NO EXISTIR en otras páginas)
            const selectsFiltro = document.getElementById('filtroCategoriaSelect');
            if (selectsFiltro) {
                selectsFiltro.innerHTML = '<option value="">Todas</option>';
                categorias.forEach(cat => {
                    selectsFiltro.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
            }
            
            // Llenar select del modal (PUEDE NO EXISTIR en otras páginas)
            const selectsModal = document.getElementById('categoria_id');
            if (selectsModal) {
                selectsModal.innerHTML = '<option value="">Seleccione...</option>';
                categorias.forEach(cat => {
                    selectsModal.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
            }
            
            console.log(`✅ ${categorias.length} categorías cargadas`);
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarMarcas() {
    try {
        const resultado = await obtenerMarcas();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            marcas = resultado.data;
            
            const selectsFiltro = document.getElementById('filtroMarcaSelect');
            if (selectsFiltro) {
                selectsFiltro.innerHTML = '<option value="">Todas</option>';
                marcas.forEach(marca => {
                    selectsFiltro.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
                });
            }
            
            const selectsModal = document.getElementById('marca_id');
            if (selectsModal) {
                selectsModal.innerHTML = '<option value="">Seleccione...</option>';
                marcas.forEach(marca => {
                    selectsModal.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
                });
            }
            
            console.log(`✅ ${marcas.length} marcas cargadas`);
        }
    } catch (error) {
        console.error('Error cargando marcas:', error);
    }
}

async function cargarUnidadesMedida() {
    try {
        const resultado = await obtenerUnidadesMedida();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            unidadesMedida = resultado.data;
            
            const select = document.getElementById('unidad_medida_id');
            if (select) {
                select.innerHTML = '<option value="">Seleccione...</option>';
                unidadesMedida.forEach(um => {
                    select.innerHTML += `<option value="${um.id}">${um.nombre} (${um.abreviatura})</option>`;
                });
            }
            
            console.log(`✅ ${unidadesMedida.length} unidades de medida cargadas`);
        }
    } catch (error) {
        console.error('Error cargando unidades de medida:', error);
    }
}

async function cargarColores() {
    try {
        const resultado = await obtenerColores();
        
        if (resultado.success && Array.isArray(resultado.data)) {
            colores = resultado.data;
            
            const select = document.getElementById('color_id');
            if (select) {
                select.innerHTML = '<option value="">Sin color</option>';
                colores.forEach(color => {
                    select.innerHTML += `<option value="${color.id}">${color.nombre} ${color.codigo_hex ? `(${color.codigo_hex})` : ''}</option>`;
                });
            }
            
            console.log(`✅ ${colores.length} colores cargados`);
        }
    } catch (error) {
        console.error('Error cargando colores:', error);
    }
}

// ======================
// CARGAR PRODUCTOS
// ======================

async function cargarProductos(pagina = 1) {
    try {
        paginaActual = pagina;
        
        const params = {
            page: pagina,
            limit: LIMITE_POR_PAGINA
        };
        
        const buscarInput = document.getElementById('buscarInput');
        const filtroCategoriaSelect = document.getElementById('filtroCategoriaSelect');
        const filtroMarcaSelect = document.getElementById('filtroMarcaSelect');
        
        if (buscarInput) {
            const buscar = buscarInput.value.trim();
            if (buscar) params.buscar = buscar;
        }
        
        if (filtroCategoriaSelect) {
            const categoria_id = filtroCategoriaSelect.value;
            if (categoria_id) params.categoria_id = categoria_id;
        }
        
        if (filtroMarcaSelect) {
            const marca_id = filtroMarcaSelect.value;
            if (marca_id) params.marca_id = marca_id;
        }
        
        const resultado = await obtenerProductos(params);
        
        if (resultado.success && Array.isArray(resultado.data)) {
            productosCache = resultado.data;
            renderizarProductos(resultado.data);
            
            if (resultado.pagination) {
                totalPaginas = resultado.pagination.totalPages;
                renderizarPaginacion(resultado.pagination);
                
                const totalProductosElement = document.getElementById('totalProductos');
                if (totalProductosElement) {
                    totalProductosElement.textContent = 
                        `${resultado.pagination.total} producto${resultado.pagination.total !== 1 ? 's' : ''}`;
                }
            }
            
            console.log(`✅ ${resultado.data.length} productos cargados (página ${pagina})`);
        } else {
            renderizarProductos([]);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarError('Error al cargar los productos');
        renderizarProductos([]);
    }
}

function renderizarProductos(productos) {
    const tbody = document.getElementById('productosTableBody');
    
    if (!tbody) {
        console.error('❌ No se encontró #productosTableBody');
        return;
    }
    
    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p class="mt-3 mb-0">No se encontraron productos</p>
                    <small class="text-muted">Intenta ajustar los filtros de búsqueda</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>
                <img src="${producto.imagen_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23ddd\' width=\'60\' height=\'60\'/%3E%3Ctext fill=\'%23999\' x=\'10\' y=\'35\'%3ESin imagen%3C/text%3E%3C/svg%3E'}" 
                     alt="${producto.nombre}" 
                     class="producto-img"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'60\\' height=\\'60\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'10\\' y=\\'35\\'%3ESin imagen%3C/text%3E%3C/svg%3E'">
            </td>
            <td><code>${producto.sku}</code></td>
            <td>
                <strong>${producto.nombre}</strong>
                ${producto.descripcion ? `<br><small class="text-muted">${producto.descripcion.substring(0, 50)}...</small>` : ''}
            </td>
            <td>${producto.categoria ? producto.categoria.nombre : '-'}</td>
            <td>${producto.marca ? producto.marca.nombre : '-'}</td>
            <td class="fw-bold text-primary">${formatearPrecio(producto.precio_venta)}</td>
            <td>${producto.unidad_medida ? producto.unidad_medida.abreviatura : '-'}</td>
            <td>
                <span class="badge ${producto.estado === 1 ? 'bg-success' : 'bg-danger'}">
                    ${producto.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="table-actions text-center">
                <button class="btn btn-info btn-sm" onclick="verStock(${producto.id})" title="Ver Stock">
                    <i class="bi bi-bar-chart-line"></i>
                </button>
                <button class="btn btn-warning btn-sm" onclick="abrirModalEditar(${producto.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarProductoConfirm(${producto.id})" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderizarPaginacion(pagination) {
    const paginacionDiv = document.getElementById('paginacion');
    
    if (!paginacionDiv) return;
    
    if (totalPaginas <= 1) {
        paginacionDiv.innerHTML = '';
        return;
    }
    
    let html = `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
            html += `
                <li class="page-item ${i === paginaActual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === paginaActual - 3 || i === paginaActual + 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacionDiv.innerHTML = html;
}

function cambiarPagina(pagina) {
    if (pagina < 1 || pagina > totalPaginas) return;
    cargarProductos(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ======================
// BÚSQUEDA Y FILTROS
// ======================

function buscarProductos() {
    cargarProductos(1);
}

function aplicarFiltros() {
    cargarProductos(1);
}

// ======================
// CREAR/EDITAR PRODUCTO
// ======================

function abrirModalCrear() {
    productoEditando = null;
    
    const titulo = document.getElementById('modalProductoTitulo');
    if (titulo) {
        titulo.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nuevo Producto';
    }
    
    const form = document.getElementById('formProducto');
    if (form) form.reset();
    
    const productoId = document.getElementById('productoId');
    if (productoId) productoId.value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
    modal.show();
}

async function abrirModalEditar(productoId) {
    try {
        const resultado = await obtenerProductoPorId(productoId);
        
        if (!resultado.success || !resultado.data) {
            throw new Error('Producto no encontrado');
        }
        
        productoEditando = resultado.data;
        
        const titulo = document.getElementById('modalProductoTitulo');
        if (titulo) {
            titulo.innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Producto';
        }
        
        // Llenar formulario
        const campos = {
            productoId: productoEditando.id,
            sku: productoEditando.sku,
            nombre: productoEditando.nombre,
            descripcion: productoEditando.descripcion || '',
            categoria_id: productoEditando.categoria_id || '',
            marca_id: productoEditando.marca_id || '',
            unidad_medida_id: productoEditando.unidad_medida_id || '',
            precio_venta: productoEditando.precio_venta,
            descuento_porcentaje: productoEditando.descuento_porcentaje || 0,
            color_id: productoEditando.color_id || '',
            duracion_anos: productoEditando.duracion_anos || '',
            cobertura_m2: productoEditando.cobertura_m2 || '',
            imagen_url: productoEditando.imagen_url || ''
        };
        
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) elemento.value = campos[campo];
        });
        
        const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
        modal.show();
    } catch (error) {
        console.error('Error cargando producto:', error);
        mostrarError('Error al cargar los datos del producto');
    }
}

async function guardarProducto() {
    try {
        const productoId = document.getElementById('productoId')?.value;
        const isEditing = productoId !== '' && productoId !== null;
        
        const datos = {
            sku: document.getElementById('sku')?.value.trim(),
            nombre: document.getElementById('nombre')?.value.trim(),
            descripcion: document.getElementById('descripcion')?.value.trim(),
            categoria_id: parseInt(document.getElementById('categoria_id')?.value),
            marca_id: parseInt(document.getElementById('marca_id')?.value),
            unidad_medida_id: parseInt(document.getElementById('unidad_medida_id')?.value),
            precio_venta: parseFloat(document.getElementById('precio_venta')?.value),
            descuento_porcentaje: parseFloat(document.getElementById('descuento_porcentaje')?.value) || 0,
            imagen_url: document.getElementById('imagen_url')?.value.trim() || null,
            color_id: document.getElementById('color_id')?.value ? parseInt(document.getElementById('color_id')?.value) : null,
            duracion_anos: document.getElementById('duracion_anos')?.value ? parseInt(document.getElementById('duracion_anos')?.value) : null,
            cobertura_m2: document.getElementById('cobertura_m2')?.value ? parseFloat(document.getElementById('cobertura_m2')?.value) : null
        };
        
        if (!datos.sku || !datos.nombre || !datos.categoria_id || !datos.marca_id || !datos.unidad_medida_id || !datos.precio_venta) {
            mostrarError('Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (datos.precio_venta <= 0) {
            mostrarError('El precio debe ser mayor a 0');
            return;
        }
        
        const resultado = isEditing 
            ? await actualizarProducto(productoId, datos)
            : await crearProducto(datos);
        
        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al guardar producto');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProducto'));
        if (modal) modal.hide();
        
        mostrarExito(resultado.message || 'Producto guardado exitosamente');
        await cargarProductos(paginaActual);
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarError(error.message || 'Error al guardar el producto');
    }
}

// ======================
// ELIMINAR PRODUCTO
// ======================

async function eliminarProductoConfirm(productoId) {
    const producto = productosCache.find(p => p.id === productoId);
    
    if (!confirm(`¿Estás seguro de eliminar el producto "${producto?.nombre || 'este producto'}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const resultado = await eliminarProducto(productoId);
        
        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al eliminar producto');
        }
        
        mostrarExito('Producto eliminado exitosamente');
        await cargarProductos(paginaActual);
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        mostrarError(error.message || 'Error al eliminar el producto');
    }
}

// ======================
// VER STOCK
// ======================

async function verStock(productoId) {
    try {
        const producto = productosCache.find(p => p.id === productoId);
        const resultado = await obtenerStockProducto(productoId);
        
        if (!resultado.success) {
            throw new Error('Error al obtener stock');
        }
        
        const inventarios = resultado.data || [];
        const content = document.getElementById('stockContent');
        
        if (!content) return;
        
        if (inventarios.length === 0) {
            content.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Este producto no tiene stock asignado en ninguna sucursal
                </div>
            `;
        } else {
            content.innerHTML = `
                <h6 class="mb-3">${producto.nombre}</h6>
                <div class="list-group">
                    ${inventarios.map(inv => `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${inv.sucursal.nombre}</strong>
                                    <br>
                                    <small class="text-muted">Stock Mínimo: ${inv.stock_minimo} | Máximo: ${inv.stock_maximo}</small>
                                </div>
                                <div>
                                    <span class="badge badge-stock ${inv.stock_actual < inv.stock_minimo ? 'bg-danger' : 'bg-success'} fs-6">
                                        ${inv.stock_actual} unidades
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 text-end">
                    <strong>Total: ${inventarios.reduce((sum, inv) => sum + inv.stock_actual, 0)} unidades</strong>
                </div>
            `;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('modalStock'));
        modal.show();
        
    } catch (error) {
        console.error('Error obteniendo stock:', error);
        mostrarError('Error al obtener el stock del producto');
    }
}