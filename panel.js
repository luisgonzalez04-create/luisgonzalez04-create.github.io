import { supabase } from './supabase.js'

let PRODUCTOS = [];
let cantidadRegistros = 0;

// Función para cargar datos desde Supabase
async function cargarProductosDesdeSupabase() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .eq('id_usuario', localStorage.getItem("usuario"));

        if (error) {
            console.error('Error al consultar:', error.message);
            return;
        }

        PRODUCTOS = data.map(item => ({
            id: item.id_producto,
            nombre: item.nombre,
            categoria: item.categoria,
            proveedor: item.proveedor,
            cantidad: item.cantidad,
            precioUnitario: item.precio_unitario,
            fecha: item.fecha,
            descripcion: item.descripcion
        }));

        console.log('Productos cargados:', PRODUCTOS);
        buildTable();
        crearFiltroPanel(PRODUCTOS); // ✅ Llamar aquí después de cargar y construir tabla
    } catch (err) {
        console.error('Error inesperado:', err);
    }

    try {
        // Obtener la fila con el id_producto más alto (orden descendente, límite 1)
        const { data: maxRow, error } = await supabase
            .from('inventario')
            .select('id_producto')
            .order('id_producto', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error al obtener el id máximo:', error.message);
            return;
        }

        if (Array.isArray(maxRow) && maxRow.length > 0) {
            cantidadRegistros = (maxRow[0].id_producto ?? 0) + 1;
            console.log('ID máximo encontrado:', maxRow[0].id_producto);
        } else {
            // No hay productos todavía
            cantidadRegistros = 1;
            console.log('No hay productos en inventario. Se inicia en ID 1.');
        }
    } catch (err) {
        console.error('Error inesperado al obtener el id máximo:', err);
    }
}

const btnAnalisis = document.querySelector("#btnAnalisis");

btnAnalisis.addEventListener("click", () => {
    localStorage.setItem("productos",JSON.stringify(PRODUCTOS));
    window.location.href = "analisis.html";
});



const btnAbrirAgregar = document.querySelector("#btnAbrirAgregar");
const btnCerrarAgregar = document.querySelector("#btnCerrarAgregar");
const modalAgregar = document.querySelector("#modalAgregar");
const btnAgregar = document.querySelector("#btnAgregar");

btnAbrirAgregar.addEventListener("click", ()=>{
    modalAgregar.showModal();
    calcularTotalIngresos();
});
btnCerrarAgregar.addEventListener("click", ()=>{
    modalAgregar.close();
});

btnAgregar.addEventListener("click", async ()=>{
    const nuevoProducto = {
        id_producto: cantidadRegistros,
        nombre: document.getElementById("nombreProducto").value,
        categoria: document.getElementById("categoriaProducto").value,
        proveedor: document.getElementById("proveedorProducto").value,
        cantidad: parseInt(document.getElementById("cantidadProducto").value),
        precio_unitario: parseFloat(document.getElementById("precioProducto").value),
        fecha: document.getElementById("fechaProducto").value,
        descripcion: document.getElementById("descripcionProducto").value,
        id_usuario: localStorage.getItem("usuario")
    };

    try {
        const { error } = await supabase
            .from('inventario')
            .insert([nuevoProducto])
            .select();

        if (error) {
            console.error('Error al insertar:', error.message);
            alert('Error al agregar producto: ' + error.message);
            return;
        }

        buildTable();
        modalAgregar.close();
        cargarProductosDesdeSupabase();
    } catch (err) {
        console.error('Error inesperado:', err);
        alert('Error al agregar producto');
    }
});


const btnAbrirModificar = document.querySelector("#btnAbrirModificar");
const btnCerrarModificar = document.querySelector("#btnCerrarModificar");
const btnModificar = document.querySelector("#btnModificar");
const modalModificar = document.querySelector("#modalModificar");

btnAbrirModificar.addEventListener("click", ()=>{
    modalModificar.showModal();
});
btnCerrarModificar.addEventListener("click", ()=>{
    modalModificar.close();
});
btnModificar.addEventListener("click", async ()=>{
    const id = parseInt(document.getElementById("idProductoModificar").value);
    
    const productoActualizado = {
        nombre: document.getElementById("nuevoNombreProducto").value,
        categoria: document.getElementById("nuevaCategoriaProducto").value,
        proveedor: document.getElementById("nuevoProveedorProducto").value,
        cantidad: parseInt(document.getElementById("nuevaCantidadProducto").value),
        precio_unitario: parseFloat(document.getElementById("nuevoPrecioProducto").value),
        fecha: document.getElementById("nuevaFechaProducto").value,
        descripcion: document.getElementById("nuevaDescripcionProducto").value
    };

    try {
        const { error } = await supabase
            .from('inventario')
            .update(productoActualizado)
            .eq('id_producto', id)
            .eq('id_usuario', localStorage.getItem("usuario"));

        if (error) {
            console.error('Error al actualizar:', error.message);
            alert('Error al modificar');
            return;
        }

        alert('Producto modificado correctamente');
        cargarProductosDesdeSupabase();
    } catch (err) {
        console.error('Error:', err);
    }
    modalModificar.close();
});


const btnAbrirEliminar = document.querySelector("#btnAbrirEliminar");
const btnCerrarEliminar = document.querySelector("#btnCerrarEliminar");
const btnEliminar = document.querySelector("#btnEliminar");
const modalEliminar = document.querySelector("#modalEliminar");

btnAbrirEliminar.addEventListener("click", ()=>{
    modalEliminar.showModal();
});

window.addEventListener("load", () => {
    if (localStorage.getItem("usuario") === null) {
        window.location.href = "registro.html";
        return;
    }
    buildTable();
    cargarProductosDesdeSupabase(); // ✅ Esto llamará crearFiltroPanel() cuando termine
    calcularTotalIngresos
});

btnCerrarEliminar.addEventListener("click", ()=>{
    modalEliminar.close();
});

btnEliminar.addEventListener("click", async ()=>{
    const idProductoEliminar = parseInt(document.getElementById("idProductoEliminar").value);

    if (isNaN(idProductoEliminar)) {
        alert('ID inválido. Ingresa un número de producto válido.');
        return;
    }

    try {
        // Intentar eliminar solo el producto que pertenece al usuario actual
        const { data, error } = await supabase
            .from('inventario')
            .delete()
            .eq('id_producto', idProductoEliminar)
            .eq('id_usuario', localStorage.getItem("usuario"))
            .select();

        if (error) {
            console.error('Error al eliminar:', error.message);
            alert('Error al eliminar: ' + error.message);
            return;
        }

        // Si no se devolvieron filas, no se encontró el producto para este usuario
        if (!data || data.length === 0) {
            alert('No se encontró el producto o no pertenece a tu cuenta. No se realizó ninguna acción.');
            modalEliminar.close();
            return;
        }

        // Borrar localmente si existe
        const index = PRODUCTOS.findIndex(producto => producto.id === idProductoEliminar);
        if (index !== -1) PRODUCTOS.splice(index, 1);
        buildTable();
        alert('Producto eliminado correctamente');
    } catch (err) {
        console.error('Error:', err);
        alert('Error inesperado al eliminar');
    } finally {
        modalEliminar.close();
    }
});

const btnCerrarSesion = document.querySelector("#btnCerrarSesion");
btnCerrarSesion.addEventListener("click", ()=>{
    localStorage.removeItem("usuario");
    window.location.href = "index.html";
});


function buildTable() {
    let htmlString = "";

    htmlString += "<table>";
    htmlString += "<tr>";
    htmlString += "<th>ID</th>";
    htmlString += "<th>Nombre</th>";
    htmlString += "<th>Categoría</th>";
    htmlString += "<th>Proveedor</th>";
    htmlString += "<th>Cantidad</th>";
    htmlString += "<th>Precio Unitario</th>";
    htmlString += "<th>Fecha</th>";
    htmlString += "<th>Descripción</th>";
    htmlString += "</tr>";

    for (let index = 0; index < PRODUCTOS.length; index++) {
        const producto = PRODUCTOS[index];
        htmlString += "<tr>";
        htmlString += `<td>${producto.id}</td>`;
        htmlString += `<td>${producto.nombre}</td>`;
        htmlString += `<td>${producto.categoria}</td>`;
        htmlString += `<td>${producto.proveedor}</td>`;
        htmlString += `<td>${producto.cantidad}</td>`;
        htmlString += `<td>${producto.precioUnitario}</td>`;
        htmlString += `<td>${producto.fecha}</td>`;
        htmlString += `<td>${producto.descripcion}</td>`;
        htmlString += "</tr>";
    }

    htmlString += "</table>";
    console.log(htmlString);
    let tableContainer = document.querySelector("#tableContainer");
    tableContainer.innerHTML = htmlString;
}

// Crear filtro de categorías
function crearFiltroPanel(productosList) {
    const select = document.getElementById('filterCategoriaPanel');
    if (!select) return;

    const categorias = [...new Set(productosList.map(p => p.categoria || 'Sin categoría'))].sort();
    
    while (select.options.length > 1) select.remove(1);
    categorias.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
        let productosAMostrar = PRODUCTOS;
        if (e.target.value !== '') {
            productosAMostrar = PRODUCTOS.filter(p => (p.categoria || 'Sin categoría') === e.target.value);
        }
        buildTableFiltered(productosAMostrar);
    });
}

// Versión de buildTable que acepta lista filtrada
function buildTableFiltered(productosParaMostrar) {
    let htmlString = "<table>";
    htmlString += "<tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Proveedor</th><th>Cantidad</th><th>Precio Unitario</th><th>Fecha</th><th>Descripción</th></tr>";
    
    for (let p of productosParaMostrar) {
        htmlString += "<tr>";
        htmlString += `<td>${p.id}</td><td>${p.nombre}</td><td>${p.categoria}</td><td>${p.proveedor}</td><td>${p.cantidad}</td><td>${p.precioUnitario}</td><td>${p.fecha}</td><td>${p.descripcion}</td>`;
        htmlString += "</tr>";
    }
    
    htmlString += "</table>";
    document.querySelector("#tableContainer").innerHTML = htmlString;
}

function calcularTotalIngresos() {
    let Ingresos = 0;  

    let totalIngresos = document.getElementById("totalIngresos");
    totalIngresos.innerHTML = `<p>Total de ingresos: ${Ingresos}</p>`

}