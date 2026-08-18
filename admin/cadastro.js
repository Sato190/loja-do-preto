const client=window.supabaseClient;
const form=document.querySelector('#signup-form');
const signupCard=document.querySelector('#signup-card');
const successCard=document.querySelector('#success-card');
let signupEmail='';

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
  const submit=form.querySelector('[type="submit"]');
  submit.disabled=true;setStatus('Criando seu acesso e enviando a confirmação…');
  const redirectTo=`${location.origin}/admin/?confirmed=1`;
  const {error}=await client.auth.signUp({email:values.email,password:values.password,options:{emailRedirectTo:redirectTo}});
  submit.disabled=false;
  if(error){setStatus(error.message,true);return}
  signupEmail=values.email;
  document.querySelector('#sent-email').textContent=signupEmail;
  signupCard.classList.add('hidden');successCard.classList.remove('hidden');
});

document.querySelector('#resend').addEventListener('click',async event=>{
  if(!signupEmail)return;
  event.currentTarget.disabled=true;setStatus('Reenviando…',false,successCard);
  const {error}=await client.auth.resend({type:'signup',email:signupEmail,options:{emailRedirectTo:`${location.origin}/admin/?confirmed=1`}});
  event.currentTarget.disabled=false;setStatus(error?error.message:'E-mail reenviado. Confira também a caixa de spam.',!!error,successCard);
});

