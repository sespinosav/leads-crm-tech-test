import 'reflect-metadata';
import { Lead } from '../leads/entities/lead.entity';
import { LeadSource } from '../leads/lead-source.enum';
import { AppDataSource } from './data-source';

/**
 * Idempotent-ish seed: clears the `leads` table (hard delete) then inserts a
 * fixed set of 12 sample leads spanning every channel and budget range. Run
 * with `npm run seed`.
 */
interface SeedRow {
  nombre: string;
  email: string;
  telefono: string | null;
  fuente: LeadSource;
  productoInteres: string | null;
  presupuesto: number | null;
}

const samples: SeedRow[] = [
  { nombre: 'Laura Gómez',     email: 'laura.gomez@example.com',     telefono: '+57 300 1112233', fuente: 'instagram' as LeadSource,    productoInteres: 'Curso de copywriting',     presupuesto: 350 },
  { nombre: 'Andrés Pérez',    email: 'andres.perez@example.com',    telefono: '+57 301 2223344', fuente: 'facebook' as LeadSource,     productoInteres: 'Mentoría 1:1',              presupuesto: 1200 },
  { nombre: 'María Rodríguez', email: 'maria.rodriguez@example.com', telefono: null,              fuente: 'landing_page' as LeadSource, productoInteres: 'E-book de ventas',          presupuesto: 49 },
  { nombre: 'Carlos Torres',   email: 'carlos.torres@example.com',   telefono: '+57 302 3334455', fuente: 'referido' as LeadSource,     productoInteres: 'Programa anual',            presupuesto: 2400 },
  { nombre: 'Diana Castro',    email: 'diana.castro@example.com',    telefono: null,              fuente: 'otro' as LeadSource,         productoInteres: 'Asesoría puntual',          presupuesto: null },
  { nombre: 'Felipe Sánchez',  email: 'felipe.sanchez@example.com',  telefono: '+57 303 4445566', fuente: 'instagram' as LeadSource,    productoInteres: 'Curso de funnels',          presupuesto: 250 },
  { nombre: 'Valentina Ruiz',  email: 'valentina.ruiz@example.com',  telefono: '+57 304 5556677', fuente: 'instagram' as LeadSource,    productoInteres: 'Workshop en vivo',          presupuesto: 180 },
  { nombre: 'Sebastián López', email: 'sebastian.lopez@example.com', telefono: null,              fuente: 'facebook' as LeadSource,     productoInteres: 'Plantillas premium',        presupuesto: 79 },
  { nombre: 'Camila Mejía',    email: 'camila.mejia@example.com',    telefono: '+57 305 6667788', fuente: 'landing_page' as LeadSource, productoInteres: 'Bootcamp 8 semanas',        presupuesto: 990 },
  { nombre: 'Juan David Ríos', email: 'juan.rios@example.com',       telefono: '+57 306 7778899', fuente: 'referido' as LeadSource,     productoInteres: 'Mentoría 1:1',              presupuesto: 1500 },
  { nombre: 'Ana Quintero',    email: 'ana.quintero@example.com',    telefono: null,              fuente: 'otro' as LeadSource,         productoInteres: null,                        presupuesto: null },
  { nombre: 'Mateo Vargas',    email: 'mateo.vargas@example.com',    telefono: '+57 307 8889900', fuente: 'instagram' as LeadSource,    productoInteres: 'Curso de copywriting',     presupuesto: 320 },
];

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Lead);

  // Clear existing data (hard delete) — including soft-deleted rows.
  await repo.createQueryBuilder().delete().execute();

  // Stagger createdAt across the last 14 days to make stats / filters useful.
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const rows = samples.map((s, i) => repo.create({
    ...s,
    createdAt: new Date(now - i * day * 1.2),
  }));
  await repo.save(rows);

  // eslint-disable-next-line no-console
  console.log(`✅ Seeded ${rows.length} leads`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
