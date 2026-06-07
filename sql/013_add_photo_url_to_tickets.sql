alter table tickets
  add column if not exists photo_url text;

comment on column tickets.photo_url is 'URL to uploaded photo of the issue (stored in Supabase Storage)';
