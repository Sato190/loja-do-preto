const client=window.supabaseClient;
const form=document.querySelector('#signup-form');
const signupCard=document.querySelector('#signup-card');
const ADMIN_EMAIL='andrenevessato04@gmail.com';

function setStatus(message,error=false,root=signupCard){const el=root.querySelector('.status');el.textContent=message;el.style.color=error?'#ff7b7b':'#24bd69'}

document.querySelectorAll('[data-toggle]').forEach(button=>{
  const input=document.querySelector(`#${button.dataset.toggle}`);
  input.addEventListener('input',()=>{button.hidden=!input.value;if(!input.value)input.type='password'});
  button.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';const label=show?'Ocultar senha':'Mostrar senha';button.setAttribute('aria-label',label);button.title=label;input.focus()});
});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){setStatus('O serviço de cadastro está indisponível.',true);return}
  const values=Object.fromEntries(new FormData(form));
  if(values.password!==values.confirmPassword){setStatus('As senhas não são iguais.',true);return}
  if(values.email.trim().toLowerCase()===ADMIN_EMAIL){setStatus('Este e-mail já está confirmado. Use “Entrar no painel” ou recupere sua senha.',true);setTimeout(()=>{location.href='recuperar.html'},1800);return}
  const submit=form.querySelector('[type="submit"]');
  submit.disabled=true;setStatus('Criando seu acesso…');
  const {data,error}=await client.auth.signUp({email:values.email,password:values.password});
  submit.disabled=false;
  if(error){setStatus(error.message,true);return}
  if(data.session){location.href='./?pending=1';return}
  setStatus('Cadastro criado, mas a confirmação de e-mail ainda está ativa no Supabase. Desative “Confirm Email” para liberar o acesso imediato.',true);
});

