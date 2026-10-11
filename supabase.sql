-- AGENDA BARBERIA (prefijo agenda_) - pegar completo en SQL Editor del proyecto del template.
-- No toca ninguna tabla existente.

create table agenda_servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  duracion_min integer not null default 30,
  precio integer not null default 0,
  activo boolean default true
);

create table agenda_barberos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean default true
);

create table agenda_citas (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid references agenda_barberos(id) on delete cascade,
  servicio_id uuid references agenda_servicios(id) on delete set null,
  cliente_nombre text not null,
  cliente_telefono text not null,
  fecha date not null,
  hora time not null,
  duracion_min integer not null,
  estado text not null default 'confirmada' check (estado in ('confirmada','cancelada')),
  created_at timestamptz default now()
);

create unique index agenda_citas_unica on agenda_citas (barbero_id, fecha, hora) where estado = 'confirmada';
create index agenda_citas_fecha on agenda_citas (fecha);

insert into agenda_servicios (nombre, duracion_min, precio) values
  ('Corte clásico', 30, 150),
  ('Corte + barba', 60, 250),
  ('Barba', 30, 100),
  ('Corte niño', 30, 120);

insert into agenda_barberos (nombre) values ('Carlos'), ('Miguel'), ('Luis');

alter table agenda_servicios enable row level security;
alter table agenda_barberos enable row level security;
alter table agenda_citas enable row level security;

create policy "agenda leer servicios" on agenda_servicios for select using (true);
create policy "agenda leer barberos" on agenda_barberos for select using (true);
create policy "agenda leer citas" on agenda_citas for select using (true);
create policy "agenda crear citas" on agenda_citas for insert with check (true);
create policy "agenda admin actualiza citas" on agenda_citas for update using (auth.role() = 'authenticated');
create policy "agenda admin escribe servicios" on agenda_servicios for all using (auth.role() = 'authenticated');
create policy "agenda admin escribe barberos" on agenda_barberos for all using (auth.role() = 'authenticated');

-- Panel /admin: usa un usuario ya existente en Authentication > Users del proyecto.
