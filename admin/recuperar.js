const client=window.supabaseClient;
const requestCard=document.querySelector('#request-card');
const updateCard=document.querySelector('#update-card');
const recoveryForm=document.querySelector('#recovery-form');
const updateForm=document.querySelector('#update-form');

function setStatus(root,message,error=false){const el=root.querySelector('.status');el.textContent=message;el.style.color=error?'#ff7b7b':'#24bd69'}

document.querySelectorAll('[data-toggle]').forEach(button=>{const input=document.querySelector(`#${button.dataset.toggle}`);input.addEventListener('input',()=>{button.hidden=!input.value;if(!input.value)input.type='password'});button.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');input.focus()})});

client.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){requestCard.classList.add('hidden');updateCard.classList.remove('hidden')}});

recoveryForm.addEventListener('submit',async event=>{event.preventDefault();const email=new FormData(recoveryForm).get('email');const button=recoveryForm.querySelector('button');button.disabled=true;setStatus(recoveryForm,'Enviando o link…');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/admin/recuperar.html`});button.disabled=false;setStatus(recoveryForm,error?error.message:'Link enviado. Confira a caixa de entrada e também o spam.',!!error)});

updateForm.addEventListener('submit',async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(updateForm));if(values.password!==values.confirmPassword){setStatus(updateForm,'As senhas não são iguais.',true);return}const button=updateForm.querySelector('button');button.disabled=true;setStatus(updateForm,'Salvando a nova senha…');const {error}=await client.auth.updateUser({password:values.password});button.disabled=false;if(error){setStatus(updateForm,error.message,true);return}setStatus(updateForm,'Senha atualizada. Abrindo o painel…');setTimeout(()=>{location.href='./'},1200)});

