// Cargar productos destacados al inicio
document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductosDestacados();
    await cargarSucursales();
});

// Cargar productos destacados
async function cargarProductosDestacados() {
    const container = document.getElementById('productos-destacados');
    
    try {
        const response = await obtenerProductos({ limit: 8, page: 1 });
        
        if (response.success && response.data.length > 0) {
            container.innerHTML = response.data.map(producto => `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <div class="product-card" onclick="verProducto(${producto.id})">
                        <img src="${producto.imagen_url || 'https://via.placeholder.com/300x200?text=Producto'}" 
                             class="product-image" 
                             alt="${producto.nombre}"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Producto'">
                        <div class="product-body">
                            <div class="product-category">${producto.categoria.nombre}</div>
                            <h5 class="product-title">${producto.nombre}</h5>
                            <div class="product-price">Q${parseFloat(producto.precio_venta).toFixed(2)}</div>
                            <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                                <i class="bi bi-cart-plus"></i> Agregar al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="col-12 text-center"><p>No hay productos disponibles</p></div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error al cargar productos</p></div>';
    }
}

// Ver detalle de producto
function verProducto(id) {
    window.location.href = `/producto-detalle.html?id=${id}`;
}

// Buscar productos
function buscarProductos(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    if (query.trim()) {
        window.location.href = `/catalogo.html?buscar=${encodeURIComponent(query)}`;
    }
}