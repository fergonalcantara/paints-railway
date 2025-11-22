/**
 * carrito.js - Manejo del carrito de compras
 * Compatible con el formato esperado por el checkout
 */

// Carrito en localStorage
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Actualizar badge del carrito
function actualizarCarritoBadge() {
    const badge = document.getElementById('cart-badge');
    const cantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    badge.textContent = cantidad;

    if (cantidad > 0) {
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function agregarAlCarrito(producto, cantidad = 1) {
    const existente = carrito.find(item => item.producto_id === producto.id);

    if (existente) {
        existente.cantidad += cantidad;
        existente.subtotal = existente.cantidad * existente.precio_unitario;
    } else {
        const precio = parseFloat(producto.precio_venta);
        const descuento = parseFloat(producto.descuento_porcentaje || 0);
        const precioFinal = precio - (precio * descuento / 100);

        carrito.push({
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            producto_sku: producto.sku,
            cantidad: cantidad,
            precio_unitario: precioFinal,
            descuento_porcentaje: descuento,
            subtotal: precioFinal * cantidad,

            producto: {
                id: producto.id,
                nombre: producto.nombre,
                sku: producto.sku,
                precio_venta: precio,
                imagen_url: producto.imagen_url
            }
        });
    }

    guardarCarrito();
    actualizarCarritoBadge();
    actualizarVistaCarrito();
    mostrarNotificacion('Producto agregado al carrito', 'success');
}

// Remover del carrito
function removerDelCarrito(productoId) {
    carrito = carrito.filter(item => item.producto_id !== productoId);
    guardarCarrito();
    actualizarCarritoBadge();
    actualizarVistaCarrito();
}

// Actualizar cantidad
function actualizarCantidad(productoId, cantidad) {
    const item = carrito.find(item => item.producto_id === productoId);

    if (item) {
        item.cantidad = parseInt(cantidad);

        if (item.cantidad <= 0) {
            removerDelCarrito(productoId);
        } else {
            guardarCarrito();
            actualizarVistaCarrito();
        }
    }
}

// Guardar en localStorage
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    console.log('💾 Carrito guardado:', carrito.length, 'productos');
}

// Limpiar carrito
function limpiarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarCarritoBadge();
    actualizarVistaCarrito();
}

// Calcular total
function calcularTotal() {
    return carrito.reduce((sum, item) => {
        const precio = parseFloat(item.precio_unitario);
        const cantidad = parseInt(item.cantidad);
        const descuento = parseFloat(item.descuento_porcentaje || 0);

        const subtotal = precio * cantidad;
        const descuentoMonto = subtotal * (descuento / 100);

        return sum + (subtotal - descuentoMonto);
    }, 0);
}

// Toggle carrito offcanvas
function toggleCarrito() {
    const offcanvas = new bootstrap.Offcanvas(document.getElementById('carritoOffcanvas'));
    actualizarVistaCarrito();
    offcanvas.show();
}

// Actualizar vista del carrito
function actualizarVistaCarrito() {
    const carritoItems = document.getElementById('carrito-items');
    const carritoTotal = document.getElementById('carrito-total');
    const totalAmount = document.getElementById('carrito-total-amount');

    if (carrito.length === 0) {
        carritoItems.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-3">Tu carrito está vacío</p>
            </div>
        `;
        carritoTotal.style.display = 'none';
        return;
    }

    carritoItems.innerHTML = carrito.map(item => `
        <div class="carrito-item mb-3 p-3 border rounded">
            <div class="row align-items-center">
                <div class="col-3">
                    <img src="${item.producto.imagen_url || '/img/producto-default.jpg'}" 
                         alt="${item.producto_nombre}" 
                         class="img-fluid rounded">
                </div>
                <div class="col-6">
                    <h6 class="mb-1">${item.producto_nombre}</h6>
                    <p class="text-muted small mb-1">SKU: ${item.producto_sku}</p>
                    <p class="text-primary fw-bold mb-0">Q${item.precio_unitario.toFixed(2)}</p>
                    ${item.descuento_porcentaje > 0 ?
            `<span class="badge bg-success">-${item.descuento_porcentaje}%</span>` : ''}
                </div>
                <div class="col-3">
                    <div class="input-group input-group-sm mb-2">
                        <button class="btn btn-outline-secondary" 
                                onclick="actualizarCantidad(${item.producto_id}, ${item.cantidad - 1})">
                            <i class="bi bi-dash"></i>
                        </button>
                        <input type="number" 
                               class="form-control text-center" 
                               value="${item.cantidad}" 
                               min="1"
                               onchange="actualizarCantidad(${item.producto_id}, this.value)">
                        <button class="btn btn-outline-secondary" 
                                onclick="actualizarCantidad(${item.producto_id}, ${item.cantidad + 1})">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-danger btn-sm w-100" 
                            onclick="removerDelCarrito(${item.producto_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    carritoTotal.style.display = 'block';
    totalAmount.textContent = `Q${calcularTotal().toFixed(2)}`;
}

// Ir al checkout
function irAlCheckout() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    // El carrito ya está guardado en localStorage
    window.location.href = '/checkout.html';
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Agregar al DOM
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);

    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remover del DOM después de ocultarse
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarCarritoBadge();
});