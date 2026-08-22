begin;

drop policy if exists "leads public insert" on public.leads;

create or replace function public.submit_public_lead(
  lead_source text,
  lead_name text,
  lead_phone text default null,
  lead_email text default null,
  lead_vehicle text default null,
  lead_details jsonb default '{}'::jsonb,
  website text default null
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare clean_name text:=trim(lead_name); clean_phone text:=left(trim(coalesce(lead_phone,'')),32); clean_email text:=left(lower(trim(coalesce(lead_email,''))),254); created_id text;
begin
  if coalesce(website,'')<>'' then return jsonb_build_object('accepted',true); end if;
  if lead_source not in ('home_financing','home_trade','journey_financing','journey_trade','journey_sell','sell_page','contact') then raise exception 'invalid source'; end if;
  if length(clean_name) not between 2 and 120 then raise exception 'invalid name'; end if;
  if clean_phone='' and clean_email='' then raise exception 'contact required'; end if;
  if octet_length(coalesce(lead_details,'{}'::jsonb)::text)>12000 then raise exception 'payload too large'; end if;
  if exists(select 1 from public.leads where source=lead_source and coalesce(phone,'')=clean_phone and coalesce(email,'')=clean_email and created_at>now()-interval '2 minutes') then
    return jsonb_build_object('accepted',true,'duplicate',true);
  end if;
  insert into public.leads(source,name,phone,email,vehicle_interest,details)
  values(lead_source,clean_name,nullif(clean_phone,''),nullif(clean_email,''),nullif(left(trim(coalesce(lead_vehicle,'')),200),''),lead_details)
  returning id::text into created_id;
  return jsonb_build_object('accepted',true,'id',created_id);
end $$;

revoke all on function public.submit_public_lead(text,text,text,text,text,jsonb,text) from public;
grant execute on function public.submit_public_lead(text,text,text,text,text,jsonb,text) to anon,authenticated;

commit;
