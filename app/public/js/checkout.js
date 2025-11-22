// ===== Variables locales =====
const btnFinalizar = document.getElementById('btn-finalizar');
const checkoutItems = document.getElementById('checkout-items');
const carritoVacio = document.getElementById('carrito-vacio');

// Mostrar usuario y actualizar UI
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof actualizarUIUsuario === 'function') {
            actualizarUIUsuario();
        }
    } catch (e) {
        console.warn('actualizarUIUsuario no disponible', e);
    }

    cargarCarritoDesdeLocal();
    renderizarCheckout();
    habilitarBotonSegunEstado();
});

// ==== Asegurarnos de que siempre exista un carrito ====
function cargarCarritoDesdeLocal() {
    // Si el carrito global existe y tiene items, lo usamos
    if (typeof carrito !== 'undefined' && Array.isArray(carrito)) {
        return carrito;
    }

    // Si NO existe (porque carrito.js no está incluido aquí), lo obtenemos del localStorage
    const local = JSON.parse(localStorage.getItem('carrito')) || [];
    window.carrito = local; // lo creamos como variable global para usarlo igual
    return carrito;
}

// ===== Renderizar carrito en checkout =====
function renderizarCheckout() {
    cargarCarritoDesdeLocal();

    if (!carrito || carrito.length === 0) {
        checkoutItems.innerHTML = '';
        carritoVacio.style.display = 'block';

        document.getElementById('res-subtotal').textContent = 'Q0.00';
        document.getElementById('res-descuento').textContent = 'Q0.00';
        document.getElementById('res-total').textContent = 'Q0.00';
        return;
    }

    carritoVacio.style.display = 'none';

    checkoutItems.innerHTML = carrito.map(item => {
        const precio = parseFloat(item.precio_unitario);
        const cantidad = parseInt(item.cantidad);
        const descuentoPct = parseFloat(item.descuento_porcentaje || 0);

        const subtotal = precio * cantidad;
        const descuentoMonto = subtotal * (descuentoPct / 100);
        const totalItem = subtotal - descuentoMonto;

        return `
            <div class="d-flex align-items-center mb-3">
                <img src="${item.producto?.imagen_url || '/img/producto-default.jpg'}"
                     alt="${item.producto_nombre}" class="producto-img rounded me-3">

                <div class="flex-grow-1">
                    <h6 class="mb-0">${item.producto_nombre}</h6>
                    <small class="text-muted">SKU: ${item.producto_sku}</small>

                    <div class="mt-1">
                        <span class="fw-bold">Q${precio.toFixed(2)}</span>
                        ${descuentoPct > 0 ? `<span class="badge bg-success ms-2">-${descuentoPct}%</span>` : ''}
                        <small class="text-muted ms-3">x ${cantidad}</small>
                    </div>
                </div>

                <div class="text-end">
                    <div class="fw-bold">Q${totalItem.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');

    // ===== CALCULAR TOTALES =====
    let total = 0;

    if (typeof calcularTotal === 'function') {
        total = calcularTotal();
    } else {
        total = carrito.reduce((sum, it) => {
            const precio = parseFloat(it.precio_unitario);
            const cantidad = parseInt(it.cantidad);
            const descuento = parseFloat(it.descuento_porcentaje || 0);

            const st = precio * cantidad;
            return sum + (st - (st * (descuento / 100)));
        }, 0);
    }

    const subtotalBruto = carrito.reduce((s, it) =>
        s + (parseFloat(it.precio_unitario) * parseInt(it.cantidad)), 0
    );

    const descuentoTotal = subtotalBruto - total;

    document.getElementById('res-subtotal').textContent = `Q${subtotalBruto.toFixed(2)}`;
    document.getElementById('res-descuento').textContent = `Q${descuentoTotal.toFixed(2)}`;
    document.getElementById('res-total').textContent = `Q${total.toFixed(2)}`;
}

// ===== Control del botón finalizar =====
function habilitarBotonSegunEstado() {
    const items = carrito || [];
    const tieneItems = items.length > 0;

    // === ESTA ES LA PARTE CORREGIDA ===
    const sucursalId = localStorage.getItem("sucursalActualId");
    const tieneSucursal = sucursalId !== null;

    const usuarioLog = (typeof usuarioActual !== 'undefined' && usuarioActual);
    const clienteFisicoNombre = document.getElementById('cliente_fisico_nombre').value.trim();

    // Si no hay carrito o no hay sucursal → desactivar
    if (!tieneItems || !tieneSucursal) {
        btnFinalizar.disabled = true;
        return;
    }

    // Si no hay usuario y no llenaron datos manuales → desactivar
    if (!usuarioLog && clienteFisicoNombre.length === 0) {
        btnFinalizar.disabled = true;
        return;
    }

    btnFinalizar.disabled = false;
}

// Re-render al cambiar localStorage desde otra pestaña
window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
        cargarCarritoDesdeLocal();
        renderizarCheckout();
        habilitarBotonSegunEstado();
    }
});

/**
 * FINALIZAR COMPRA – Adaptado del POS (efectivo + cliente CF)
 */

document.addEventListener("DOMContentLoaded", () => {
    const btnFinalizar = document.getElementById("btn-finalizar");
    if (btnFinalizar) {
        btnFinalizar.addEventListener("click", finalizarCompraCheckout);
    }
});

// Detectar cambios de sucursal (misma pestaña)
window.addEventListener("storage", () => {
    habilitarBotonSegunEstado();
});

// Detectar cambios realizados DESDE LA MISMA PÁGINA del checkout
window.addEventListener("sucursal-cambiada", () => {
    habilitarBotonSegunEstado();
});


async function finalizarCompraCheckout() {
    try {
        if (!carrito || carrito.length === 0) {
            mostrarResultado("Tu carrito está vacío");
            return;
        }

        // Deshabilitar botón durante proceso
        const btn = document.getElementById("btn-finalizar");
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Procesando...`;

        // Sucursal cercana
        const sucursalId = localStorage.getItem("sucursalActualId");
        if (!sucursalId) {
            mostrarResultado("No se detectó sucursal. Asegúrate de permitir ubicación.");
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check2-circle"></i> Finalizar compra (Efectivo)`;
            return;
        }

        let cliente_id = null;

        // Si el usuario está logueado → usar su ID
        if (usuarioActual && usuarioActual.id) {
            cliente_id = usuarioActual.id;
        } else {
            // Cliente físico CF → usar cliente por defecto del sistema
            cliente_id = 1; // <-- ID del cliente CF en BD
        }

        // === ARMAR DETALLE ===  
        const detalle = carrito.map(item => {
            const precio = parseFloat(item.precio_unitario);
            const cantidad = parseInt(item.cantidad);

            return {
                producto_id: item.producto_id,
                cantidad,
                precio_unitario: precio,
                subtotal: precio * cantidad
            };
        });


        const subtotal = detalle.reduce((acc, i) => acc + i.subtotal, 0);
        const descuento = 0;
        const total = subtotal;

        // === BODY PARA API ===
        const facturaBody = {
            sucursal_id: Number(sucursalId),
            cliente_id: cliente_id,
            tipo_venta: "online",
            metodos_pago: [
                {
                    metodo_pago: "efectivo",
                    monto: total
                }
            ],
            subtotal,
            descuento,
            total,
            observaciones: document.getElementById("observaciones")?.value || "",
            productos: detalle
        };


        console.log("🧾 Enviando factura:", facturaBody);

        // === LLAMAR API ===
        const resultado = await crearFactura(facturaBody);

        if (!resultado.success) {
            mostrarResultado("Error al generar factura: " + (resultado.message || "Error desconocido"));
        } else {
            ultimaFacturaGenerada = resultado.data;
            mostrarResultado("¡Compra realizada correctamente!", true, resultado.data.id);
            carrito = [];
            localStorage.setItem("carrito", JSON.stringify([]));
            actualizarCarritoBadge();
        }

    } catch (error) {
        console.error("Error al finalizar compra:", error);
        mostrarResultado("Ocurrió un error al finalizar la compra");
    } finally {
        const btn = document.getElementById("btn-finalizar");
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-check2-circle"></i> Finalizar compra (Efectivo)`;
    }
}

/**
 * Mostrar el resultado en el modal del checkout
 */
function mostrarResultado(mensaje, exito = false, facturaId = null) {
    const body = document.getElementById("resultadoModalBody");
    const link = document.getElementById("ver-factura-link");

    body.innerHTML = `<p>${mensaje}</p>`;

    if (exito && facturaId) {
        link.style.display = "inline-block";
        link.href = `/facturas/${facturaId}`;
    } else {
        link.style.display = "none";
    }

    const modal = new bootstrap.Modal(document.getElementById("resultadoModal"));
    modal.show();
}