import { supabase } from './supabase.js'

let USUARIOS = [];

// referencias DOM
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnIniciarSesion = document.querySelector("#btnIniciarSesion");

// cargar usuarios desde Supabase (trae todos los usuarios)
async function cargarUsuariosDesdeSupabase() {
    try {
        const { data, error } = await supabase
            .from('usuarios')  // nombre de tu tabla
            .select('*');

        if (error) {
            console.error('Error al consultar:', error.message);
            return;
        }

        USUARIOS = data.map(item => ({
            id: item.id,
            nombre: item.nombre,
            password: item.password
        }));

        console.log('Usuarios cargados:', USUARIOS);
    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

// iniciar: cargar usuarios al cargar el script
cargarUsuariosDesdeSupabase();

btnIniciarSesion.addEventListener("click", () => {
    const usuario = usernameInput.value.trim();
    const clave = passwordInput.value;

    if (!usuario || !clave) {
        alert('Ingresa usuario y contraseña');
        return;
    }

    const found = USUARIOS.find(u => u.nombre === usuario && u.password === clave);
    if (found) {
        localStorage.setItem("usuario", found.id);
        window.location.href = "panel.html";
    } else {
        alert("Usuario o contraseña incorrectos");
    }
});

window.onload = function() {
    if (localStorage.getItem("usuario") !== null) {
        window.location.href = "panel.html";
    }
};