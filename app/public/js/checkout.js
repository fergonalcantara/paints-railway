/**
 * checkout.js - Manejo del proceso de checkout
 * Mantiene la sesión, sucursal cercana y carrito del index
 */

// Variables globales
let carritoActual = [];
let metodosPagoDisponibles = [];
let metodoSeleccionado = null;
let usuarioActual = null;
let sucursalCercana = null;

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛒 Inicializando checkout...');
    
    try {
        // 1. Verificar sesión (si existe)
        usuarioActual = await verificarSesion();
        
        // 2. Recuperar sucursal más cercana del localStorage
        sucursalCercana = JSON.parse(localStorage.getItem('sucursalCercana'));
        if (!sucursalCercana) {
            console.warn('⚠️ No hay sucursal cercana guardada, usando sucursal por defecto');
            sucursalCercana = { id: 1, nombre: 'Sucursal Principal' };
        }
        console.log('📍 Sucursal seleccionada:', sucursalCercana.nombre);
        
        // 3. Cargar carrito
        await cargarCarrito();
        
        // 4. Validar que el carrito tenga productos
        if (carritoActual.length === 0) {
            alert('Tu carrito está vacío. Serás redirigido a la página principal.');
            window.location.href = '/';
            return;
        }
        
        // 5. Inicializar componentes
        await cargarDepartamentos();
        await cargarMetodosPago();
        mostrarResumenCarrito();
        
        // 6. Pre-llenar datos si el usuario está logueado
        if (usuarioActual) {
            preLlenarDatosUsuario();
        }
        
        console.log('✅ Checkout inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar checkout:', error);
        alert('Error al cargar el checkout. Por favor, intenta nuevamente.');
    }
});

// ======================
// VERIFICAR SESIÓN
// ======================

async function verificarSesion() {
    try {
        const sesion = await obtenerSesion();
        
        if (sesion && sesion.success) {
            console.log('✅ Usuario logueado:', sesion.usuario.email);
            actualizarNavUsuario(sesion.usuario);
            return sesion.usuario;
        } else {
            console.log('ℹ️ Usuario invitado (sin sesión)');
            actualizarNavInvitado();
            return null;
        }
    } catch (error) {
        console.log('ℹ️ Usuario invitado (sin sesión)');
        actualizarNavInvitado();
        return null;
    }
}

function actualizarNavUsuario(usuario) {
    const navUsuario = document.getElementById('navUsuario');
    navUsuario.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle"></i> ${usuario.nombre}
        </a>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/perfil.html">Mi Perfil</a></li>
            <li><a class="dropdown-item" href="/mis-pedidos.html">Mis Pedidos</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="cerrarSesion()">Cerrar Sesión</a></li>
        </ul>
    `;
}

function actualizarNavInvitado() {
    const navUsuario = document.getElementById('navUsuario');
    navUsuario.innerHTML = `
        <a class="nav-link" href="/login.html">
            <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
        </a>
    `;
}

// ======================
// CARGAR CARRITO
// ======================

async function cargarCarrito() {
    try {
        if (usuarioActual) {
            // Usuario logueado: obtener del servidor
            const resultado = await obtenerCarrito();
            if (resultado.success && resultado.data) {
                carritoActual = resultado.data.items || [];
            }
        } else {
            // Invitado: obtener de localStorage
            carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
        }
        
        console.log('🛒 Carrito cargado:', carritoActual.length, 'productos');
        
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        carritoActual = [];
    }
}

// ======================
// MOSTRAR RESUMEN DEL CARRITO
// ======================

function mostrarResumenCarrito() {
    const resumenDiv = document.getElementById('resumenProductos');
    
    if (carritoActual.length === 0) {
        resumenDiv.innerHTML = '<p class="text-muted">No hay productos en el carrito</p>';
        return;
    }
    
    let subtotal = 0;
    let descuentoTotal = 0;
    
    const html = carritoActual.map(item => {
        const precio = parseFloat(item.precio_unitario || item.producto?.precio_venta || 0);
        const cantidad = parseInt(item.cantidad || 0);
        const descuento = parseFloat(item.descuento_porcentaje || 0);
        
        const subtotalItem = precio * cantidad;
        const descuentoItem = subtotalItem * (descuento / 100);
        const totalItem = subtotalItem - descuentoItem;
        
        subtotal += subtotalItem;
        descuentoTotal += descuentoItem;
        
        return `
            <div class="summary-item">
                <img src="${item.producto?.imagen_url || '/img/producto-default.jpg'}" 
                     alt="${item.producto?.nombre || item.producto_nombre || 'Producto'}">
                <div class="summary-item-info">
                    <div class="summary-item-name">
                        ${item.producto?.nombre || item.producto_nombre || 'Producto'}
                    </div>
                    <div class="text-muted small">Cantidad: ${cantidad}</div>
                    ${descuento > 0 ? `<div class="text-success small">-${descuento}% descuento</div>` : ''}
                    <div class="summary-item-price">Q${totalItem.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    resumenDiv.innerHTML = html;
    
    const total = subtotal - descuentoTotal;
    
    document.getElementById('subtotal').textContent = `Q${subtotal.toFixed(2)}`;
    document.getElementById('descuento').textContent = descuentoTotal > 0 ? `-Q${descuentoTotal.toFixed(2)}` : 'Q0.00';
    document.getElementById('total').textContent = `Q${total.toFixed(2)}`;
}

// ======================
// PRE-LLENAR DATOS DE USUARIO
// ======================

function preLlenarDatosUsuario() {
    if (!usuarioActual) return;
    
    document.getElementById('nombre').value = usuarioActual.nombre || '';
    document.getElementById('apellido').value = usuarioActual.apellido || '';
    document.getElementById('email').value = usuarioActual.email || '';
    document.getElementById('telefono').value = usuarioActual.telefono || '';
    document.getElementById('nit').value = usuarioActual.nit || 'CF';
    document.getElementById('dpi').value = usuarioActual.dpi || '';
    document.getElementById('direccion').value = usuarioActual.direccion || '';
    
    console.log('✅ Datos de usuario pre-llenados');
}

// ======================
// CARGAR DEPARTAMENTOS Y MUNICIPIOS
// ======================

async function cargarDepartamentos() {
    try {
        const resultado = await obtenerDepartamentos();
        const selectDpto = document.getElementById('departamento');
        
        if (resultado.success && resultado.data) {
            selectDpto.innerHTML = '<option value="">Seleccione...</option>' +
                resultado.data.map(dpto => 
                    `<option value="${dpto.id}">${dpto.nombre}</option>`
                ).join('');
        }
        
        // Event listener para cargar municipios
        selectDpto.addEventListener('change', cargarMunicipios);
        
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
    }
}

async function cargarMunicipios() {
    const departamentoId = document.getElementById('departamento').value;
    const selectMun = document.getElementById('municipio');
    
    if (!departamentoId) {
        selectMun.innerHTML = '<option value="">Seleccione departamento primero...</option>';
        return;
    }
    
    try {
        const resultado = await obtenerMunicipiosPorDepartamento(departamentoId);
        
        if (resultado.success && resultado.data) {
            selectMun.innerHTML = '<option value="">Seleccione...</option>' +
                resultado.data.map(mun => 
                    `<option value="${mun.id}">${mun.nombre}</option>`
                ).join('');
        }
        
    } catch (error) {
        console.error('Error al cargar municipios:', error);
        selectMun.innerHTML = '<option value="">Error al cargar municipios</option>';
    }
}

// ======================
// CARGAR MÉTODOS DE PAGO
// ======================

async function cargarMetodosPago() {
    try {
        const resultado = await obtenerMetodosPago();
        
        if (resultado.success && resultado.data) {
            metodosPagoDisponibles = resultado.data;
            mostrarMetodosPago();
        }
        
    } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
    }
}

function mostrarMetodosPago() {
    const contenedor = document.getElementById('metodosPago');
    
    const html = metodosPagoDisponibles.map(metodo => `
        <div class="payment-method" data-metodo-id="${metodo.id}" onclick="seleccionarMetodoPago(${metodo.id})">
            <input type="radio" name="metodoPago" value="${metodo.id}">
            <div class="payment-method-header">
                <div class="d-flex align-items-center">
                    <i class="payment-method-icon ${getIconoMetodoPago(metodo.nombre)}"></i>
                    <div>
                        <strong>${metodo.nombre}</strong>
                        ${metodo.descripcion ? `<div class="text-muted small">${metodo.descripcion}</div>` : ''}
                    </div>
                </div>
            </div>
            ${getDetallesMetodoPago(metodo)}
        </div>
    `).join('');
    
    contenedor.innerHTML = html;
}

function getIconoMetodoPago(nombre) {
    const iconos = {
        'Efectivo': 'bi-cash-coin',
        'Tarjeta de Crédito': 'bi-credit-card-2-front',
        'Tarjeta de Débito': 'bi-credit-card',
        'Transferencia Bancaria': 'bi-bank',
        'Cheque': 'bi-wallet2'
    };
    
    return iconos[nombre] || 'bi-wallet2';
}

function getDetallesMetodoPago(metodo) {
    const nombre = metodo.nombre.toLowerCase();
    
    if (nombre.includes('tarjeta')) {
        return `
            <div class="payment-details">
                <div class="row">
                    <div class="col-12 mb-2">
                        <label class="form-label small">Número de tarjeta</label>
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="1234 5678 9012 3456" maxlength="19">
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">Fecha de exp.</label>
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="MM/AA" maxlength="5">
                    </div>
                    <div class="col-6 mb-2">
                        <label class="form-label small">CVV</label>
                        <input type="text" class="form-control form-control-sm" 
                               placeholder="123" maxlength="4">
                    </div>
                </div>
            </div>
        `;
    } else if (nombre.includes('transferencia')) {
        return `
            <div class="payment-details">
                <div class="mb-2">
                    <label class="form-label small">Número de referencia</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="Ingrese el número de referencia">
                </div>
                <div class="mb-2">
                    <label class="form-label small">Banco</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="Nombre del banco">
                </div>
            </div>
        `;
    } else if (nombre.includes('cheque')) {
        return `
            <div class="payment-details">
                <div class="mb-2">
                    <label class="form-label small">Número de cheque</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="Número del cheque">
                </div>
                <div class="mb-2">
                    <label class="form-label small">Banco emisor</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="Nombre del banco">
                </div>
            </div>
        `;
    }
    
    return '';
}

function seleccionarMetodoPago(metodoId) {
    // Remover selección anterior
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Agregar selección al método clickeado
    const metodoElement = document.querySelector(`[data-metodo-id="${metodoId}"]`);
    metodoElement.classList.add('selected');
    metodoElement.querySelector('input[type="radio"]').checked = true;
    
    metodoSeleccionado = metodoId;
    console.log('💳 Método de pago seleccionado:', metodoId);
}

// ======================
// CONFIRMAR PEDIDO
// ======================

async function confirmarPedido() {
    // Validar formulario
    const form = document.getElementById('formCheckout');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Validar método de pago
    if (!metodoSeleccionado) {
        alert('Por favor, selecciona un método de pago');
        return;
    }
    
    // Confirmar con el usuario
    if (!confirm('¿Confirmas que deseas realizar este pedido?')) {
        return;
    }
    
    // Preparar datos de la factura
    const datosFactura = {
        // Cliente
        cliente_tipo: usuarioActual ? 'usuario' : 'cliente_fisico',
        cliente_id: usuarioActual ? usuarioActual.id : null,
        cliente_nombre: document.getElementById('nombre').value,
        cliente_apellido: document.getElementById('apellido').value,
        cliente_nit: document.getElementById('nit').value || 'CF',
        cliente_email: document.getElementById('email').value,
        cliente_telefono: document.getElementById('telefono').value,
        cliente_direccion: document.getElementById('direccion').value,
        cliente_dpi: document.getElementById('dpi').value,
        
        // Ubicación
        municipio_id: parseInt(document.getElementById('municipio').value),
        
        // Sucursal
        sucursal_id: sucursalCercana.id,
        
        // Tipo de venta
        tipo_venta: 'online',
        
        // Productos
        productos: carritoActual.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario || item.producto.precio_venta,
            descuento_porcentaje: item.descuento_porcentaje || 0
        })),
        
        // Pago
        metodos_pago: [{
            metodo_pago_id: metodoSeleccionado,
            monto: calcularTotal()
        }],
        
        // Notas
        observaciones: document.getElementById('notas').value
    };
    
    console.log('📤 Enviando pedido:', datosFactura);
    
    try {
        // Mostrar loader
        const btn = event.target;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
        
        const resultado = await crearFactura(datosFactura);
        
        if (resultado.success) {
            // Limpiar carrito
            if (usuarioActual) {
                await vaciarCarrito();
            } else {
                localStorage.removeItem('carrito');
            }
            
            // Redirigir a página de confirmación
            alert('¡Pedido realizado con éxito! N° Factura: ' + resultado.data.numero_factura);
            window.location.href = '/confirmacion.html?factura=' + resultado.data.id;
        } else {
            throw new Error(resultado.message);
        }
        
    } catch (error) {
        console.error('❌ Error al confirmar pedido:', error);
        alert('Error al procesar el pedido: ' + error.message);
        
        // Restaurar botón
        const btn = event.target;
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Pedido';
    }
}

function calcularTotal() {
    let total = 0;
    
    carritoActual.forEach(item => {
        const precio = parseFloat(item.precio_unitario || item.producto?.precio_venta || 0);
        const cantidad = parseInt(item.cantidad || 0);
        const descuento = parseFloat(item.descuento_porcentaje || 0);
        
        const subtotal = precio * cantidad;
        const descuentoMonto = subtotal * (descuento / 100);
        total += subtotal - descuentoMonto;
    });
    
    return total;
}