 import { supabase } from './supabase.js'

const form = document.getElementById('registerForm');
const msg = document.getElementById('formMessage');

//Saber total de usuarios registrados
async function obtenerTotalUsuarios() {
  try {
    const { count, error } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error('Error al obtener el conteo:', error.message);
      return 0;
    }  
    return count;
    } catch (err) {
        console.error('Error inesperado al obtener el conteo:', err);
        return 0;
    }
} 

// Mostrar error en campo
function showError(el, text) {
  const existing = el.parentElement.querySelector('.error');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'error';
  div.textContent = text;
  el.parentElement.appendChild(div);
}

// Limpiar errores
function clearErrors() {
  form.querySelectorAll('.error').forEach(e => e.remove());
  msg.textContent = '';
  msg.className = '';
}

// Verificar si usuario ya existe
async function usuarioExiste(username) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('nombre', username);
    
    if (error) {
      console.error('Error al consultar usuario:', error.message);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Error inesperado:', err);
    return false;
  }
}

// Manejar envío de formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  let valid = true;

  // Validaciones básicas
  if (!values.username) {
    showError(document.getElementById('username'), 'El usuario es requerido.');
    valid = false;
  }
  if (!values.password || values.password.length < 8) {
    showError(document.getElementById('password'), 'La contraseña debe tener al menos 8 caracteres.');
    valid = false;
  }
  if (values.password !== values.confirmPassword) {
    showError(document.getElementById('confirmPassword'), 'Las contraseñas no coinciden.');
    valid = false;
  }
  if (!values.terms) {
    showError(document.getElementById('terms'), 'Debes aceptar los términos.');
    valid = false;
  }

  if (!valid) return;

  // Mostrar mensaje de carga
  msg.className = 'success';
  msg.textContent = 'Verificando disponibilidad...';

  // Verificar si usuario existe
  if (await usuarioExiste(values.username)) {
    showError(document.getElementById('username'), 'Este usuario ya está registrado.');
    msg.className = '';
    msg.textContent = '';
    return;
  }

  // Intentar guardar en Supabase
  try {
    const { data: insertData, error } = await supabase
      .from('usuarios')
      .insert([{
        id: (await obtenerTotalUsuarios()) + 1,
        nombre: values.username,
        descripcion: null,
        password: values.password
      }])
      .select();

    if (error) {
      console.error('Error al crear usuario:', error.message);
      msg.className = 'error';
      msg.textContent = 'Error al crear la cuenta: ' + error.message;
      return;
    }

    // Guardar id de usuario en localStorage
    if (insertData && insertData.length > 0) {
      localStorage.setItem('usuario', insertData[0].id);
    }

    // Mostrar éxito y redirigir
    msg.className = 'success';
    msg.textContent = '¡Cuenta creada correctamente! Redirigiendo al panel...';
    
    setTimeout(() => {
      window.location.href = 'panel.html';
    }, 1500);

  } catch (err) {
    console.error('Error inesperado:', err);
    msg.className = 'error';
    msg.textContent = 'Error inesperado: ' + err.message;
  }
});

// Botón cancelar
document.getElementById('cancelBtn').addEventListener('click', () => {
  if (confirm('¿Deseas cancelar el registro y limpiar el formulario?')) {
    form.reset();
    clearErrors();
  }
});
