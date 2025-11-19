/**
 * pos.js - Punto de Venta
 * Sistema de ventas en tiempo real
 */

// Variables globales
let carritoPOS = [];
let sucursalActualId = null;
let metodoPagoSeleccionado = 'efectivo';
let ultimaFacturaGenerada = null;
let busquedaTimeout = null;

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando POS...');

    try {
        await esperarLayoutListo();

        // Obtener sucursal del usuario
        if (usuarioActual && usuarioActual.sucursal_id) {
            sucursalActualId = usuarioActual.sucursal_id;

            // Cargar nombre de sucursal
            const sucursales = await obtenerSucursales();
            if (sucursales.success && Array.isArray(sucursales.data)) {
                const sucursal = sucursales.data.find(s => s.id === sucursalActualId);
                if (sucursal) {
                    document.getElementById('sucursalActual').textContent = sucursal.nombre;
                }
            }
        } else {
            mostrarError('Tu usuario no tiene una sucursal asignada. Contacta al administrador.');
            return;
        }

        // Configurar búsqueda de productos
        const inputBusqueda = document.getElementById('buscarProductoPOS');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', manejarBusqueda);
            inputBusqueda.addEventListener('focus', () => {
                if (inputBusqueda.value.length >= 2) {
                    manejarBusqueda({ target: inputBusqueda });
                }
            });
        }

        // Cerrar resultados al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.pos-search')) {
                ocultarResultados();
            }
        });

        // Cargar carrito desde localStorage (opcional)
        cargarCarritoGuardado();

        console.log('POS inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar POS:', error);
        mostrarError('Error al inicializar el punto de venta');
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
// BÚSQUEDA DE PRODUCTOS
// ======================

function manejarBusqueda(event) {
    clearTimeout(busquedaTimeout);

    const termino = event.target.value.trim();

    if (termino.length < 2) {
        ocultarResultados();
        return;
    }

    busquedaTimeout = setTimeout(() => {
        buscarProductos(termino);
    }, 300);
}

async function buscarProductos(termino) {
    try {
        if (!sucursalActualId) {
            mostrarError('No se ha seleccionado una sucursal');
            return;
        }

        const resultado = await buscarProductosPOS(termino, sucursalActualId);

        if (resultado.success && Array.isArray(resultado.data)) {
            mostrarResultados(resultado.data);
        } else {
            mostrarResultados([]);
        }
    } catch (error) {
        console.error('Error buscando productos:', error);
        mostrarError('Error al buscar productos');
    }
}

function mostrarResultados(productos) {
    const container = document.getElementById('resultadosBusqueda');

    if (!container) return;

    if (productos.length === 0) {
        container.innerHTML = `
            <div class="p-3 text-center text-muted">
                <i class="bi bi-search"></i>
                <p class="mb-0 mt-2">No se encontraron productos</p>
            </div>
        `;
        container.style.display = 'block';
        return;
    }

    // Imagen placeholder en base64 (cuadro gris)
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="60" height="60" fill="%23e9ecef"/%3E%3Ctext x="50%25" y="50%25" font-size="12" text-anchor="middle" dy=".3em" fill="%23adb5bd"%3ESin imagen%3C/text%3E%3C/svg%3E';

    container.innerHTML = productos.map(producto => {
        const stock = producto.inventarios && producto.inventarios[0] ? producto.inventarios[0].stock_actual : 0;
        const precio = parseFloat(producto.precio_venta) || 0;
        const imagenUrl = producto.imagen_url || placeholderImage;

        return `
            <div class="pos-product-item" onclick='agregarAlCarrito(${JSON.stringify(producto).replace(/'/g, "&apos;")})'>
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}" 
                     class="pos-product-image"
                     onerror="this.src='${placeholderImage}'">
                <div class="pos-product-info">
                    <div class="pos-product-name">${producto.nombre}</div>
                    <div class="pos-product-sku">${producto.sku}</div>
                </div>
                <div class="pos-product-price">${formatearPrecio(precio)}</div>
                <div class="pos-product-stock">${stock} en stock</div>
            </div>
        `;
    }).join('');

    container.style.display = 'block';
}

function ocultarResultados() {
    const container = document.getElementById('resultadosBusqueda');
    if (container) {
        container.style.display = 'none';
    }
}

// ======================
// GESTIÓN DEL CARRITO
// ======================

function agregarAlCarrito(producto) {
    try {
        // Verificar si el producto ya está en el carrito
        const indiceExistente = carritoPOS.findIndex(item => item.id === producto.id);

        const stock = producto.inventarios && producto.inventarios[0] ? producto.inventarios[0].stock_actual : 0;

        if (stock <= 0) {
            mostrarError('Producto sin stock disponible');
            return;
        }

        if (indiceExistente !== -1) {
            // Ya está en el carrito, incrementar cantidad
            const cantidadActual = carritoPOS[indiceExistente].cantidad;

            if (cantidadActual >= stock) {
                mostrarError(`Solo hay ${stock} unidades disponibles`);
                return;
            }

            carritoPOS[indiceExistente].cantidad++;
        } else {
            // Agregar nuevo producto
            carritoPOS.push({
                id: producto.id,
                sku: producto.sku,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio_venta) || 0,
                cantidad: 1,
                stock: stock
            });
        }

        // Actualizar UI
        renderizarCarrito();
        ocultarResultados();

        // Limpiar búsqueda
        const inputBusqueda = document.getElementById('buscarProductoPOS');
        if (inputBusqueda) {
            inputBusqueda.value = '';
        }

        // Guardar en localStorage
        guardarCarrito();

        console.log('Producto agregado:', producto.nombre);
    } catch (error) {
        console.error('Error agregando producto:', error);
        mostrarError('Error al agregar el producto');
    }
}

function modificarCantidad(index, nuevaCantidad) {
    nuevaCantidad = parseInt(nuevaCantidad);

    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
        return;
    }

    if (nuevaCantidad > carritoPOS[index].stock) {
        mostrarError(`Solo hay ${carritoPOS[index].stock} unidades disponibles`);
        return;
    }

    carritoPOS[index].cantidad = nuevaCantidad;
    renderizarCarrito();
    guardarCarrito();
}

function incrementarCantidad(index) {
    modificarCantidad(index, carritoPOS[index].cantidad + 1);
}

function decrementarCantidad(index) {
    if (carritoPOS[index].cantidad > 1) {
        modificarCantidad(index, carritoPOS[index].cantidad - 1);
    }
}

function eliminarDelCarrito(index) {
    carritoPOS.splice(index, 1);
    renderizarCarrito();
    guardarCarrito();
}

function renderizarCarrito() {
    const container = document.getElementById('carritoItems');
    const contador = document.getElementById('carritoContador');

    if (!container) return;

    // Actualizar contador
    if (contador) {
        contador.textContent = carritoPOS.length;
    }

    // Si está vacío
    if (carritoPOS.length === 0) {
        container.innerHTML = `
            <div class="pos-cart-empty">
                <i class="bi bi-cart-x d-block"></i>
                <p>El carrito está vacío</p>
            </div>
        `;
        actualizarTotales();
        return;
    }

    // Renderizar items
    container.innerHTML = carritoPOS.map((item, index) => `
        <div class="pos-cart-item">
            <div class="pos-cart-item-info">
                <div class="pos-cart-item-name" title="${item.nombre}">${item.nombre}</div>
                <div class="pos-cart-item-price">${formatearPrecio(item.precio)}</div>
            </div>
            <div class="pos-cart-item-qty">
                <button class="pos-qty-btn" onclick="decrementarCantidad(${index})">
                    <i class="bi bi-dash"></i>
                </button>
                <input type="number" 
                       class="pos-qty-input" 
                       value="${item.cantidad}" 
                       min="1" 
                       max="${item.stock}"
                       onchange="modificarCantidad(${index}, this.value)">
                <button class="pos-qty-btn" onclick="incrementarCantidad(${index})">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
            <div class="pos-cart-item-total">
                ${formatearPrecio(item.precio * item.cantidad)}
            </div>
            <button class="pos-cart-item-remove" onclick="eliminarDelCarrito(${index})">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');

    actualizarTotales();
}

// ======================
// ACTUALIZAR TOTALES (SIN calcular IVA nuevamente)
// ======================

function actualizarTotales() {
    const subtotalElement = document.getElementById('subtotal');
    const descuentoElement = document.getElementById('descuento');
    const ivaElement = document.getElementById('iva');
    const totalElement = document.getElementById('total');

    // Total directo (precio_venta ya incluye IVA)
    const total = carritoPOS.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Descuento
    const descuento = 0;

    // Total con descuento
    const totalConDescuento = total - descuento;

    // Calcular IVA implícito (IVA está dentro del precio)
    // Si precio incluye IVA 12%: precio = base * 1.12
    // Entonces: base = precio / 1.12
    // Y: IVA = precio - base = precio - (precio / 1.12)
    const subtotal = totalConDescuento / 1.12;
    const iva = totalConDescuento - subtotal;

    // Actualizar UI
    if (subtotalElement) subtotalElement.textContent = formatearPrecio(subtotal);
    if (descuentoElement) descuentoElement.textContent = formatearPrecio(descuento);
    if (ivaElement) ivaElement.textContent = formatearPrecio(iva);
    if (totalElement) totalElement.textContent = formatearPrecio(totalConDescuento);
}

// ======================
// MÉTODOS DE PAGO
// ======================

function seleccionarMetodoPago(metodo) {
    metodoPagoSeleccionado = metodo;

    // Actualizar UI
    document.querySelectorAll('.pos-payment-method').forEach(el => {
        el.classList.remove('active');
    });

    const elemento = document.querySelector(`[data-metodo="${metodo}"]`);
    if (elemento) {
        elemento.classList.add('active');
    }
}

// Variable global para el total a pagar
let totalAPagar = 0;

// ======================
// PROCESAR VENTA (Nueva versión con múltiples métodos)
// ======================

async function procesarVenta() {
    try {
        // Validar carrito
        if (carritoPOS.length === 0) {
            mostrarError('El carrito está vacío');
            return;
        }

        // Validar cliente
        const clienteNIT = document.getElementById('clienteNIT')?.value.trim() || 'CF';
        const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || 'Consumidor Final';

        if (!clienteNombre) {
            mostrarError('Ingresa el nombre del cliente');
            return;
        }

        // Calcular totales (precio_venta ya incluye IVA)
        const total = carritoPOS.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const descuento = 0;
        const totalConDescuento = total - descuento;

        // Calcular IVA implícito
        const subtotal = totalConDescuento / 1.12;
        const iva = totalConDescuento - subtotal;

        // Guardar total global
        totalAPagar = totalConDescuento;

        // Abrir modal de métodos de pago
        abrirModalMetodosPago(totalConDescuento);

    } catch (error) {
        console.error(' Error preparando venta:', error);
        mostrarError(error.message || 'Error al preparar la venta');
    }
}

// =====================================================
// PROCESAR COTIZACIÓN
// =====================================================
async function procesarCotizacion() {
    try {
        if (carritoPOS.length === 0) {
            mostrarError('El carrito está vacío');
            return;
        }

        if (!sucursalActualId) {
            mostrarError('No se ha identificado la sucursal');
            return;
        }

        // Preparar productos
        const productos = carritoPOS.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            descuento_porcentaje: item.descuento || 0
        }));

        // Calcular totales
        const subtotal = carritoPOS.reduce((sum, item) => {
            const descuento = (item.precio * item.cantidad * (item.descuento || 0)) / 100;
            return sum + (item.precio * item.cantidad - descuento);
        }, 0);

        const iva = subtotal * 0.12;
        const total = subtotal + iva;

        // Preparar datos de la cotización
        const datosCotizacion = {
            cliente_id: 1, // Por defecto cliente genérico
            sucursal_id: sucursalActualId,
            productos: productos,
            observaciones: ''
        };

        console.log('📝 Creando cotización:', datosCotizacion);

        // Crear cotización
        const response = await crearCotizacion(datosCotizacion);

        if (response.success) {
            mostrarExito('Cotización generada exitosamente');

            // Abrir ventana de impresión
            const numero_cotizacion = response.data.numero_cotizacion;
            window.open(`cotizacion-print.html?numero=${numero_cotizacion}`, '_blank');

            // Limpiar carrito
            carritoPOS = [];
            actualizarCarrito();

        } else {
            mostrarError(response.message || 'Error al generar cotización');
        }

    } catch (error) {
        console.error('❌ Error en procesarCotizacion:', error);
        mostrarError('Error al procesar cotización');
    }
}
// ======================
// MODAL DE MÉTODOS DE PAGO
// ======================

function abrirModalMetodosPago(total) {
    // Mostrar total
    document.getElementById('totalPagarModal').textContent = formatearPrecio(total);

    // Resetear campos
    document.getElementById('montoEfectivo').value = total.toFixed(2); // Por defecto todo en efectivo
    document.getElementById('montoTarjeta').value = '0';
    document.getElementById('montoTransferencia').value = '0';

    // Calcular
    calcularTotalIngresado();

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalMetodosPago'));
    modal.show();
}

function calcularTotalIngresado() {
    const efectivo = parseFloat(document.getElementById('montoEfectivo')?.value) || 0;
    const tarjeta = parseFloat(document.getElementById('montoTarjeta')?.value) || 0;
    const transferencia = parseFloat(document.getElementById('montoTransferencia')?.value) || 0;

    const totalIngresado = efectivo + tarjeta + transferencia;
    const faltaPorPagar = totalAPagar - totalIngresado;

    // Actualizar UI
    document.getElementById('totalIngresado').textContent = formatearPrecio(totalIngresado);
    document.getElementById('faltaPorPagar').textContent = formatearPrecio(Math.max(0, faltaPorPagar));

    // Cambiar color según si falta o sobra
    const elementoFalta = document.getElementById('faltaPorPagar');
    if (faltaPorPagar > 0) {
        elementoFalta.className = 'h5 mb-0 text-danger';
    } else if (faltaPorPagar < 0) {
        elementoFalta.className = 'h5 mb-0 text-warning';
    } else {
        elementoFalta.className = 'h5 mb-0 text-success';
    }
}

async function confirmarMetodosPago() {
    try {
        const efectivo = parseFloat(document.getElementById('montoEfectivo')?.value) || 0;
        const tarjeta = parseFloat(document.getElementById('montoTarjeta')?.value) || 0;
        const transferencia = parseFloat(document.getElementById('montoTransferencia')?.value) || 0;

        const totalIngresado = efectivo + tarjeta + transferencia;

        // Validar que el total ingresado coincida con el total a pagar
        if (Math.abs(totalIngresado - totalAPagar) > 0.01) {
            mostrarError(`El total ingresado (${formatearPrecio(totalIngresado)}) no coincide con el total a pagar (${formatearPrecio(totalAPagar)})`);
            return;
        }

        // Preparar métodos de pago
        const metodosPago = [];

        if (efectivo > 0) {
            metodosPago.push({
                metodo_pago: 'efectivo',
                monto: efectivo
            });
        }

        if (tarjeta > 0) {
            metodosPago.push({
                metodo_pago: 'tarjeta',
                monto: tarjeta
            });
        }

        if (transferencia > 0) {
            metodosPago.push({
                metodo_pago: 'transferencia',
                monto: transferencia
            });
        }

        if (metodosPago.length === 0) {
            mostrarError('Debes ingresar al menos un método de pago');
            return;
        }

        // Validar cliente
        const clienteNIT = document.getElementById('clienteNIT')?.value.trim() || 'CF';
        const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || 'Consumidor Final';

        // ✅ Calcular totales (precio_venta ya incluye IVA)
        const total = carritoPOS.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const descuento = 0;
        const totalConDescuento = total - descuento;

        // Calcular IVA implícito
        const subtotal = totalConDescuento / 1.12;
        const iva = totalConDescuento - subtotal;

        // ✅ Preparar productos (cada uno con su IVA implícito)
        const productos = carritoPOS.map(item => {
            const totalItem = item.precio * item.cantidad;
            const subtotalItem = totalItem / 1.12;
            const ivaItem = totalItem - subtotalItem;

            return {
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: subtotalItem,
                iva: ivaItem,
                total: totalItem
            };
        });

        // Preparar datos de la factura
        const datosFactura = {
            cliente_tipo: 'cliente_fisico',
            cliente_fisico: {
                nit: clienteNIT,
                nombre: clienteNombre
            },
            sucursal_id: sucursalActualId,
            tipo_venta: 'fisica',
            productos: productos,
            metodos_pago: metodosPago,
            subtotal: subtotal,
            descuento: descuento,
            iva: iva,
            total: totalConDescuento
        };

        console.log('📤 Procesando venta:', datosFactura);

        // Enviar al backend
        const resultado = await crearFactura(datosFactura);

        if (!resultado.success) {
            throw new Error(resultado.message || 'Error al procesar la venta');
        }

        // Cerrar modal de métodos de pago
        const modalPago = bootstrap.Modal.getInstance(document.getElementById('modalMetodosPago'));
        if (modalPago) modalPago.hide();

        // Venta exitosa
        ultimaFacturaGenerada = resultado.data;
        mostrarModalVentaExitosa(resultado.data);

        console.log('✅ Venta procesada:', resultado.data.numero_factura);

    } catch (error) {
        console.error('❌ Error procesando venta:', error);
        mostrarError(error.message || 'Error al procesar la venta');
    }
}

function mostrarModalVentaExitosa(factura) {
    document.getElementById('numeroFacturaGenerada').textContent = factura.numero_factura;
    document.getElementById('totalFacturaGenerada').textContent = formatearPrecio(factura.total);

    const modal = new bootstrap.Modal(document.getElementById('modalVentaExitosa'));
    modal.show();
}

function imprimirFactura() {
    if (!ultimaFacturaGenerada) return;

    // Abrir en nueva ventana para imprimir
    window.open(`/admin/factura-print.html?numero=${ultimaFacturaGenerada.numero_factura}`, '_blank');
}

function nuevaVenta() {
    // Limpiar carrito
    carritoPOS = [];
    renderizarCarrito();
    guardarCarrito();

    // Resetear cliente a CF
    document.getElementById('clienteNIT').value = 'CF';
    document.getElementById('clienteNombre').value = 'Consumidor Final';

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVentaExitosa'));
    if (modal) modal.hide();

    // Focus en búsqueda
    document.getElementById('buscarProductoPOS')?.focus();
}

function cancelarVenta() {
    if (carritoPOS.length === 0) return;

    if (confirm('¿Cancelar la venta actual? Se perderán los productos del carrito.')) {
        carritoPOS = [];
        renderizarCarrito();
        guardarCarrito();
    }
}

// ======================
// PERSISTENCIA
// ======================

function guardarCarrito() {
    try {
        localStorage.setItem('pos_carrito', JSON.stringify(carritoPOS));
    } catch (error) {
        console.error('Error guardando carrito:', error);
    }
}

function cargarCarritoGuardado() {
    try {
        const carritoGuardado = localStorage.getItem('pos_carrito');
        if (carritoGuardado) {
            carritoPOS = JSON.parse(carritoGuardado);
            renderizarCarrito();
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        carritoPOS = [];
    }
}