// Public endpoint; Turnstile is verified server-side. Database keys stay here.
const allowed: Record<string,string[]> = {
 children:['None','1','2','3','4 or more'],
 stroller_children:['None','1','2','3 or more','Not yet — planning ahead'],
 current_setup:['One single stroller','A tandem / inline double stroller','A side-by-side double stroller','Two separate single strollers','A stroller plus a carrier or ride-on board','No stroller / something else'],
 split_need:['Never','Once or twice','About weekly','Several times a week','Not applicable / not sure'],
 use_intent:['Very likely','Somewhat likely','Not sure','Somewhat unlikely','Very unlikely / I wouldn’t use it'],
 use_frequency:['Several times a week','About weekly','Once or twice a month','Less often','Never','Not sure'],
 priorities:['Tested safety and secure connections','Low weight','Small fold / easy storage','Quick, simple separation','Easy steering in both modes','Comfort for both children','Price','Durability and repairability'],
 price_range:['Under $500','$500–$799','$800–$1,099','$1,100–$1,499','$1,500 or more','Not sure','I wouldn’t buy this']
};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const origins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean);
 const headers={'Access-Control-Allow-Origin':origins.includes(origin)?origin:'null','Access-Control-Allow-Headers':'content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json'};
 const reply=(status:number,message:string)=>new Response(JSON.stringify({message}),{status,headers});
 if(!origins.includes(origin))return reply(403,'Origin not allowed');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,'POST required');
 try{
  const bodyText=await req.text(); if(bodyText.length>12000)return reply(413,'Request too large');
  const b=JSON.parse(bodyText);
  if(b.website||b.research_consent!==true||b.consent_version!=='2026-10-02'||b.survey_version!=='1'||b.currency!=='USD')return reply(400,'Invalid submission');
  if(typeof b.submission_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.submission_id))return reply(400,'Invalid submission ID');
  if(!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers)||Object.keys(b.answers).length!==8)return reply(400,'Complete all questions');
  for(const [key,options] of Object.entries(allowed)){const value=b.answers[key];if(key==='priorities'){if(!Array.isArray(value)||value.length<1||value.length>3||new Set(value).size!==value.length||!value.every((x:unknown)=>typeof x==='string'&&options.includes(x)))return reply(400,'Invalid priorities');}else if(typeof value!=='string'||!options.includes(value))return reply(400,'Invalid answer');}
  if(typeof b.email_consent!=='boolean'||(b.email!==null&&(typeof b.email!=='string'||b.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(b.email))))return reply(400,'Invalid email');
  if((b.email===null&&b.email_consent)||(b.email!==null&&!b.email_consent))return reply(400,'Email consent required');
  if(typeof b.captcha_token!=='string'||b.captcha_token.length>2048)return reply(400,'Verification required');
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:Deno.env.get('TURNSTILE_SECRET_KEY'),response:b.captcha_token}),signal:AbortSignal.timeout(10000)});
  const captcha=await verification.json();
  const allowedHosts=origins.map(s=>new URL(s).hostname);
  if(!captcha.success||!allowedHosts.includes(captcha.hostname))return reply(400,'Verification failed');
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply(503,'Storage unavailable');
  const row={submission_id:b.submission_id,answers:b.answers,email:b.email?.trim().toLowerCase()||null,email_consent:b.email_consent,research_consent:true,consent_version:b.consent_version,survey_version:b.survey_version,currency:b.currency};
  const saved=await fetch(`${url}/rest/v1/research_responses?on_conflict=submission_id`,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':`Bearer ${key}`,'Prefer':'return=minimal,resolution=ignore-duplicates'},body:JSON.stringify(row),signal:AbortSignal.timeout(10000)});
  if(!saved.ok){console.error('Research storage failed',saved.status);return reply(503,'Could not save response');}
  return reply(200,'Saved');
 }catch(error){console.error('Research request failed',error instanceof Error?error.name:'Unknown');return reply(400,'Unable to process request');}
});
