alter table tenants
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists room_number text,
  add column if not exists move_in_date date;

alter table tickets
  add column if not exists rejection_reason text;

comment on column tenants.email is 'Email address of the tenant';
comment on column tenants.phone is 'Phone number of the tenant';
comment on column tenants.room_number is 'Room number assigned to the tenant';
comment on column tenants.move_in_date is 'Date when tenant moved in';
comment on column tickets.rejection_reason is 'Reason provided by admin when rejecting a ticket';
