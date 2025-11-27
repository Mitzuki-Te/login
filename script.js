// Regex objects


loginForm.addEventListener('submit', async (ev)=>{
ev.preventDefault(); hideMsg(loginFeedback);
const email = loginEmail.value.trim().toLowerCase();
const pwd = loginPwd.value;
const users = readUsers();


if(!RE_EMAIL.test(email)){ showMsg(loginFeedback,'Formato de correo inválido.',false); return; }
if(!users[email]){ showMsg(loginFeedback,'Usuario o contraseña incorrectos.',false); return; }


const user = users[email];
if(user.locked){ showMsg(loginFeedback,'Cuenta bloqueada por intentos fallidos. Por favor recupera la contraseña.',false); return; }


const hash = await sha256Hex(pwd);
if(hash === user.pwdHash){
user.failedAttempts = 0; writeUsers(users);
showMsg(loginFeedback,`Bienvenido al sistema, ${user.name}.`,true);
} else {
user.failedAttempts = (user.failedAttempts||0) + 1;
if(user.failedAttempts >= 3){ user.locked = true; writeUsers(users); showMsg(loginFeedback,'Cuenta bloqueada por intentos fallidos.',false); }
else { writeUsers(users); showMsg(loginFeedback,'Usuario o contraseña incorrectos.',false); }
}
});


// Forgot link opens recover email preset
document.getElementById('forgotLink').addEventListener('click', (e)=>{
e.preventDefault(); document.getElementById('recEmail').value = loginEmail.value; window.location.hash = '#recover'; document.getElementById('recEmail').focus();
});


// Recovery
const recForm = document.getElementById('recoverForm');
const recEmail = document.getElementById('recEmail');
const recNewPwd = document.getElementById('recNewPwd');
const recFeedback = document.getElementById('recFeedback');
document.getElementById('recShowPwd').addEventListener('change', e=>{ recNewPwd.type = e.target.checked ? 'text' : 'password'; });


recForm.addEventListener('submit', async (ev)=>{
ev.preventDefault(); hideMsg(recFeedback);
const email = recEmail.value.trim().toLowerCase();
const newPwd = recNewPwd.value;
if(!RE_EMAIL.test(email)){ showMsg(recFeedback,'Correo inválido.',false); return; }
if(!RE_PWD.test(newPwd)){ showMsg(recFeedback,'Contraseña inválida. Debe tener mayúscula, minúscula, dígito y carácter especial, 6+ caracteres.',false); return; }


const users = readUsers();
if(!users[email]){ showMsg(recFeedback,'No existe cuenta con ese correo.',false); return; }


const newHash = await sha256Hex(newPwd);
users[email].pwdHash = newHash;
users[email].failedAttempts = 0;
users[email].locked = false;
writeUsers(users);


showMsg(recFeedback,'Contraseña actualizada. Ahora puede iniciar sesión.',true);
recForm.reset();
});


document.getElementById('cancelRecover').addEventListener('click', ()=>{ recForm.reset(); hideMsg(recFeedback); });


// Panel: show users (for testing) - do not use in producción
document.getElementById('showUsers').addEventListener('click', ()=>{
const users = readUsers();
const out = Object.values(users).map(u=>{
return `- ${u.email} | ${u.name} | phone:${u.phone} | locked:${u.locked} | failed:${u.failedAttempts} | created:${u.createdAt}`;
}).join('\n');
const list = document.getElementById('usersList');
list.textContent = out || 'No hay usuarios registrados.';
});


// Small UX: clear messages on input
document.querySelectorAll('input').forEach(i=>i.addEventListener('input', ()=>{
[regFeedback, loginFeedback, recFeedback].forEach(hideMsg);
}));


// Explanation comments (resumen):
/*
- Manejo del bloqueo: cada usuario tiene failedAttempts. Al superar 3 intentos, user.locked = true.
El login revisa user.locked y muestra mensaje "Cuenta bloqueada por intentos fallidos.".
- Recuperación: al actualizar la contraseña se recalcula el hash y se asigna, y se resetean failedAttempts y locked=false.
- Validación de contraseñas: se usa RE_PWD para asegurar mayúscula, minúscula, número y símbolo. También se valida en registro y en recuperación.
- Almacenamiento: se usa localStorage (clave auth_demo_users_v1). En un sistema real, la contraseña no se guardaría en localStorage y se usaría backend y salting + hashing seguro en servidor.
*/