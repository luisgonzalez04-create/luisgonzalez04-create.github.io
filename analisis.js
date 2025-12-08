// Obtener productos guardados en localStorage
const productos = JSON.parse(localStorage.getItem("productos")) || [];

// Mostrar total de ingresos generales (suma cantidad * precio por producto)
function calcularIngresosTotales(productosList) {
    let ingresos = 0;
    for (let i = 0; i < productosList.length; i++) {
        const p = productosList[i];
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        if (!isNaN(cantidad) && !isNaN(precio)) ingresos += cantidad * precio;
    }
    return ingresos;
}

const ingresos = calcularIngresosTotales(productos);
const ingresosEl = document.getElementById("ingresosTotales");
if (ingresosEl) ingresosEl.innerText = `Ingresos Totales: $${ingresos.toFixed(2)}`;

// Construir gráfico: mostrar las 5 categorías con mayor ingreso total
function buildTop5CategoryChart(productosList) {
    const canvas = document.getElementById('ingresosChart');
    if (!canvas) return;

    if (!productosList || productosList.length === 0) {
        // limpiar canvas
        const ctxClear = canvas.getContext('2d');
        ctxClear.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Calcular ingresos por producto
    const withRevenue = productosList.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        return Object.assign({}, p, { revenue: (isNaN(cantidad) || isNaN(precio)) ? 0 : cantidad * precio });
    });

    // Sumar ingresos por categoría
    const categoryTotalsMap = {};
    for (const p of withRevenue) {
        const cat = p.categoria || 'Sin categoría';
        categoryTotalsMap[cat] = (categoryTotalsMap[cat] || 0) + (p.revenue || 0);
    }

    // Convertir a array y ordenar desc por total
    const categoryTotalsArr = Object.entries(categoryTotalsMap).map(([categoria, total]) => ({ categoria, total }));
    categoryTotalsArr.sort((a,b) => b.total - a.total);

    // Tomar top 5 categorías
    const topCategories = categoryTotalsArr.slice(0,5);
    const labels = topCategories.map(c => c.categoria);
    const dataValues = topCategories.map(c => c.total);

    const backgroundColors = labels.map((_, i) => `rgba(${60 + i*30}, ${140 - i*10}, ${200 - i*15}, 0.8)`);

    // Destruir chart previo si existe
    if (canvas._chartInstance) canvas._chartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos totales por categoría',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(c => c.replace('0.8','1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value){ return '$' + Number(value).toFixed(2); }
                    }
                }
            },
            plugins: {
                // ocultar la leyenda
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y;
                            return `Ingreso: $${Number(val).toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });

    canvas._chartInstance = chart;
}

// Construir gráfico al cargar
buildTop5CategoryChart(productos);

// Función para generar tabla de productos ordenados por precio de venta total
function buildProductosTable(productosList) {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) return;

    if (!productosList || productosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:16px; text-align:center;">No hay productos registrados.</td></tr>';
        return;
    }

    // Calcular precio de venta total por producto y ordenar descendente
    const productosConTotal = productosList.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        const total = (isNaN(cantidad) || isNaN(precio)) ? 0 : cantidad * precio;
        return Object.assign({}, p, { precioTotal: total });
    });

    productosConTotal.sort((a, b) => b.precioTotal - a.precioTotal);

    // Generar HTML de filas
    const rows = productosConTotal.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        const total = p.precioTotal;
        
        return `
            <tr style="border-bottom:1px solid #e6e9ef;">
                <td style="padding:12px; text-align:left;">${p.id || 'N/A'}</td>
                <td style="padding:12px; text-align:left;">${p.nombre || 'N/A'}</td>
                <td style="padding:12px; text-align:right;">${cantidad}</td>
                <td style="padding:12px; text-align:right;">$${precio.toFixed(2)}</td>
                <td style="padding:12px; text-align:right; font-weight:bold;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

// Función para obtener categorías únicas
function obtenerCategoriasUnicas(productosList) {
    const categorias = new Set();
    for (const p of productosList) {
        const cat = p.categoria || 'Sin categoría';
        categorias.add(cat);
    }
    return Array.from(categorias).sort();
}

// Función para generar el selector de categorías
function crearFiltroCategoria(productosList) {
    const select = document.getElementById('filterCategoria');
    if (!select) return;

    const categorias = obtenerCategoriasUnicas(productosList);
    
    // Limpiar opciones (excepto la primera)
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Agregar categorías
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    // Listener para filtrar
    select.addEventListener('change', (e) => {
        const categoriaSeleccionada = e.target.value;
        filtrarTablaProductos(productosList, categoriaSeleccionada);
    });
}

// Función para filtrar y mostrar tabla
function filtrarTablaProductos(productosList, categoriaFiltro) {
    const tbody = document.getElementById('productosTableBody');
    if (!tbody) return;

    let productosFiltrados = productosList;
    
    // Si hay una categoría seleccionada, filtrar
    if (categoriaFiltro !== '') {
        productosFiltrados = productosList.filter(p => (p.categoria || 'Sin categoría') === categoriaFiltro);
    }

    if (productosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:16px; text-align:center;">No hay productos en esta categoría.</td></tr>';
        return;
    }

    // Calcular total y ordenar
    const productosConTotal = productosFiltrados.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        const total = (isNaN(cantidad) || isNaN(precio)) ? 0 : cantidad * precio;
        return Object.assign({}, p, { precioTotal: total });
    });

    productosConTotal.sort((a, b) => b.precioTotal - a.precioTotal);

    // Generar HTML
    const rows = productosConTotal.map(p => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precioUnitario || p.precio_unitario || 0);
        const total = p.precioTotal;
        
        return `
            <tr style="border-bottom:1px solid #e6e9ef;">
                <td style="padding:12px; text-align:left;">${p.id || 'N/A'}</td>
                <td style="padding:12px; text-align:left;">${p.nombre || 'N/A'}</td>
                <td style="padding:12px; text-align:right;">${cantidad}</td>
                <td style="padding:12px; text-align:right;">$${precio.toFixed(2)}</td>
                <td style="padding:12px; text-align:right; font-weight:bold;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

// Al cargar, crear el filtro y mostrar tabla
crearFiltroCategoria(productos);
buildProductosTable(productos);