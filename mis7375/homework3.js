/* Program: homework3.js | Author: Lubna Rahman | November 12, 2026
   Homework 3: independent JavaScript validation, live feedback and submit gate. */
'use strict';
const $ = id => document.getElementById(id);
const form = $('patientForm');
const fields = ['first_name','middle_initial','last_name','dob','ssn','email','phone','address1','address2','city','state','zip_code','symptoms','health_rating','user_id','password','password_confirm'];
const groups = {gender:['Female','Male','Other'], vaccinated:['Yes','No','Unsure'],insurance:['Yes','No','Unsure']};
const labels = {first_name:'First Name',middle_initial:'Middle Initial',last_name:'Last Name',dob:'Date of Birth',ssn:'Demo Patient ID',email:'Email',phone:'Phone',address1:'Address Line 1',address2:'Address Line 2',city:'City',state:'State',zip_code:'ZIP Code',symptoms:'Current Symptoms',health_rating:'Overall Health',user_id:'User ID',password:'Password',password_confirm:'Re-enter Password'};
const touched = new Set();
let validated = false;
const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function dateBounds() {
 const now = new Date();
 const min = new Date(now.getFullYear()-120,now.getMonth(),now.getDate());
 // Clamp leap day to the last day of February when needed.
 if(min.getMonth()!==now.getMonth()) min.setDate(0);
 return {min:localDate(min),max:localDate(now)};
}
const bounds = dateBounds();
$('today').textContent='Today is: '+new Date().toDateString();
$('dob').min=bounds.min; $('dob').max=bounds.max;
const states = new Set(Array.from($('state').options,o=>o.value).filter(Boolean));
function normalize(id) {
 if(id==='email'||id==='user_id') $(id).value=$(id).value.toLowerCase();
}
// Each rule checks the value directly; it does not depend on HTML validity.
function checkField(id) {
 const el=$(id), value=el.value;
 if(el.required && !value.trim()) return 'This field is required.';
 if(!value && !el.required) return '';
 switch(id) {
 case 'first_name': case 'last_name':
  return /^[A-Za-z'\-]{1,30}$/.test(value) ? '' : 'Use 1–30 letters, apostrophes or dashes; no digits or spaces.';
 case 'middle_initial': return /^[A-Za-z]$/.test(value)?'':'Enter one letter or leave blank.';
 case 'dob': {
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(!match) return 'Enter a complete, valid date (MM/DD/YYYY).';
  const [year,month,day]=match.slice(1).map(Number);
  const date=new Date(year,month-1,day);
  const range=dateBounds();
  if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day||value<range.min||value>range.max)
   return 'Use a real date within the last 120 years, with no future dates.';
  return '';
 }
 case 'ssn': return /^\d{9}$/.test(value)?'':'Enter exactly nine fictional digits (no spaces or dashes).';
 case 'email': return /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~\-]+@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(value)?'':'Enter an email in name@domain.tld format.';
 case 'phone': return /^\d{3}-\d{3}-\d{4}$/.test(value)?'':'Use ten digits in 713-555-0123 format.';
 case 'address1': case 'address2':
  return value.trim().length>=2 && value.length<=30 && /^[A-Za-z0-9 #.,'\/\-]+$/.test(value)?'':'Use 2–30 characters: letters, digits, spaces, #, period, comma, apostrophe, slash or dash.';
 case 'city': return value.trim().length>=2 && value.length<=30 && /^[A-Za-z .'-]+$/.test(value)?'':'Use 2–30 characters: letters, spaces, periods, apostrophes or dashes.';
 case 'state': return states.has(value)?'':'Select a state, DC or Puerto Rico.';
 case 'zip_code': return /^\d{5}$/.test(value)?'':'Enter exactly five digits.';
 case 'symptoms': return value.length<=1000 && !/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)?'':'Use up to 1000 plain-text characters; no angle brackets or control characters.';
 case 'health_rating': return /^([1-9]|10)$/.test(value)?'':'Choose a whole number from 1 through 10.';
 case 'user_id': return /^[A-Za-z_\-][A-Za-z0-9_\-]{4,19}$/.test(value)?'':'Use 5–20 letters, digits, dashes or underscores. Do not start with a number.';
 case 'password': {
  const errors=[];
  if(value.length<8||value.length>30) errors.push('8–30 characters');
  if(!/[A-Z]/.test(value)) errors.push('an uppercase letter');
  if(!/[a-z]/.test(value)) errors.push('a lowercase letter');
  if(!/\d/.test(value)) errors.push('a digit');
  if(!/[^A-Za-z0-9\s]/.test(value)) errors.push('a special character');
  if(/[\s"']/.test(value)) errors.push('no spaces or quotes');
  if(value.toLowerCase()===$('user_id').value.toLowerCase()) errors.push('a password different from your user ID');
  // Preserve the extra password checks from Homework 2.
  const uid=$('user_id').value.toLowerCase(), low=value.toLowerCase();
  const parts=[];
  for(let i=0;i<=uid.length-3;i++) parts.push(uid.slice(i,i+3));
  const names=[$('first_name').value,$('last_name').value].map(v=>v.trim().toLowerCase()).filter(Boolean);
  if([...parts,...names].some(part=>low.includes(part))) errors.push('no name or three-character portion of your user ID');
  return errors.length?'Password needs: '+errors.join('; ')+'.':'';
 }
 case 'password_confirm': return value===$('password').value?'':'Passwords must match exactly.';
 default: return '';
 }
}
function displayError(id) {
 const message=checkField(id), el=$(id);
 $(id+'_error').textContent=message;
 el.setCustomValidity(message);
 el.setAttribute('aria-invalid',String(Boolean(message)));
 return message;
}
function checkGroup(name,show=true) {
 const checked=Array.from(form.querySelectorAll(`input[name="${name}"]:checked`));
 const message=checked.length>1||checked.some(el=>!groups[name].includes(el.value))?'Select one of the listed choices.':'';
 if(show) $(name+'_error').textContent=message;
 return message;
}
function invalidateGate() {
 validated=false;
 $('submitButton').hidden=true;
 if(!$('reviewOutput').hidden) {
  $('reviewOutput').hidden=true;
  $('reviewBody').replaceChildren();
 }
 $('formMessage').textContent='Information changed. Select Validate when you are ready.';
}
function validateAll() {
 let errors=0;
 for(const id of fields) {
  normalize(id); touched.add(id);
  if(displayError(id)) errors++;
 }
 for(const name of Object.keys(groups)) if(checkGroup(name)) errors++;
 // Checkboxes are optional Boolean selections; every checked/unchecked state is valid.
 validated=errors===0;
 $('submitButton').hidden=!validated;
 $('formMessage').textContent=errors?`${errors} field(s) need attention. Correct the messages below each field.`:'Validation passed. Review your information, then select Submit.';
 return errors===0;
}
function reviewRow(label,value,status) {
 const row=document.createElement('tr');
 for(const text of [label,value,status]) {
  const cell=document.createElement('td');cell.textContent=text;row.appendChild(cell);
 }
 row.lastChild.className=status.startsWith('ERROR')?'fail':'pass';
 $('reviewBody').appendChild(row);
}
function renderReview() {
 $('reviewBody').replaceChildren();
 for(const id of fields) {
  normalize(id);
  let value=$(id).value||'(Not provided)';
  if($(id).type==='password' && $(id).value) value='••••••••';
  if(id==='dob'&&$(id).value) {const [y,m,d]=$(id).value.split('-');value=`${m}/${d}/${y}`;}
  const error=checkField(id);
  reviewRow(labels[id],value,error?'ERROR: '+error:(!$(id).value&&!$(id).required?'Optional / blank':'Pass'));
 }
 for(const el of form.querySelectorAll('input[type="checkbox"]')) reviewRow(el.parentElement.textContent.trim(),el.checked?'Yes':'No','Optional');
 for(const name of Object.keys(groups)) reviewRow(name[0].toUpperCase()+name.slice(1),form.querySelector(`input[name="${name}"]:checked`)?.value||'(Not selected)',checkGroup(name,false)||'Optional');
 $('reviewOutput').hidden=false;
}
for(const id of fields) {
 const el=$(id);
 el.setAttribute('aria-describedby',id+'_error');
 // Visible, persistent instructions supplement context-sensitive title text.
 if(el.title) {
  const hint=document.createElement('small');hint.className='field-hint';hint.id=id+'_hint';hint.textContent=el.title;
  el.insertAdjacentElement('afterend',hint);
  el.setAttribute('aria-describedby',id+'_hint '+id+'_error');
 }
 for(const eventName of ['input','change','blur']) el.addEventListener(eventName,()=>{
  if(eventName!=='blur') invalidateGate();
  normalize(id);touched.add(id);displayError(id);
  if(id==='health_rating') $('health_value').textContent=el.value+' / 10';
  // A username edit can invalidate the password; a password edit can invalidate confirmation.
  if(['user_id','first_name','last_name'].includes(id) && (touched.has('password')||$('password').value)) displayError('password');
  if((id==='password'||id==='user_id') && (touched.has('password_confirm')||$('password_confirm').value)) displayError('password_confirm');
 });
}
for(const el of form.querySelectorAll('input[type="radio"],input[type="checkbox"]')) {
 el.addEventListener('change',()=>{invalidateGate();if(el.type==='radio') checkGroup(el.name);});
}
$('validateButton').addEventListener('click',()=>{
 if(!validateAll()) form.querySelector('[aria-invalid="true"]')?.focus();
});
$('reviewButton').addEventListener('click',()=>{
 renderReview();
 $('formMessage').textContent=validated?'Review the summary below, then select Submit.':'Review the summary below. Select Validate to check the form and unlock Submit.';
 $('reviewOutput').scrollIntoView({behavior:'smooth'});
});
form.addEventListener('submit',event=>{
 event.preventDefault();
 // Enter-key submission must not bypass the explicit Validate step.
 if(!validated) {
  $('formMessage').textContent='Select Validate first. Submit appears only when all fields pass.';
  return;
 }
 if(!validateAll()) {form.querySelector('[aria-invalid="true"]')?.focus();return;}
 // Do not send form fields in a URL or store secrets in this classroom demo.
 window.location.assign('thankyou.html');
});
form.addEventListener('reset',()=>{
 validated=false;touched.clear();$('submitButton').hidden=true;
 for(const id of fields) {$(id).setCustomValidity('');$(id).removeAttribute('aria-invalid');$(id+'_error').textContent='';}
 for(const name of Object.keys(groups)) $(name+'_error').textContent='';
 $('health_value').textContent='5 / 10';$('formMessage').textContent='';$('reviewOutput').hidden=true;$('reviewBody').replaceChildren();
});
