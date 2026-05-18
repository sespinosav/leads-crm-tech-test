import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LEAD_SOURCES, LeadSource } from './lead-source.enum';
import { LeadsService } from './leads.service';

/**
 * Minimal Typeform-style webhook adapter. Typeform posts a payload that
 * contains a `form_response.answers` array; we translate the answers we care
 * about into our `CreateLeadDto` shape and delegate to the service.
 *
 * We accept the payload as `unknown` and do the validation manually so that
 * the webhook is forgiving with non-essential / extra fields — third-party
 * providers love to add new metadata.
 */
@ApiTags('webhooks')
@Controller('leads/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Typeform-style webhook for inbound leads' })
  async handle(@Body() payload: TypeformPayload) {
    const flat = this.flatten(payload);
    this.logger.log(`Webhook received: ${JSON.stringify(flat)}`);

    if (!flat.email || !flat.nombre || !flat.fuente) {
      return {
        accepted: false,
        reason: 'Missing required fields (nombre, email, fuente)',
        parsed: flat,
      };
    }

    const lead = await this.leadsService.create({
      nombre: flat.nombre,
      email: flat.email,
      telefono: flat.telefono,
      fuente: flat.fuente,
      productoInteres: flat.productoInteres,
      presupuesto: flat.presupuesto,
    });
    return { accepted: true, leadId: lead.id };
  }

  private flatten(payload: TypeformPayload): Partial<{
    nombre: string;
    email: string;
    telefono: string;
    fuente: LeadSource;
    productoInteres: string;
    presupuesto: number;
  }> {
    const answers = payload?.form_response?.answers ?? [];
    const out: Record<string, unknown> = {};

    for (const a of answers) {
      const key = a.field?.ref ?? a.field?.id;
      if (!key) continue;
      const value =
        a.text ?? a.email ?? a.phone_number ?? a.number ?? a.choice?.label;
      if (value === undefined) continue;
      out[key] = value;
    }

    // Normalise `fuente`
    const fuente = (out.fuente as string | undefined)?.toLowerCase();
    return {
      nombre: out.nombre as string | undefined,
      email: out.email as string | undefined,
      telefono: out.telefono as string | undefined,
      fuente: LEAD_SOURCES.includes(fuente as LeadSource)
        ? (fuente as LeadSource)
        : undefined,
      productoInteres: out.producto_interes as string | undefined,
      presupuesto:
        typeof out.presupuesto === 'number'
          ? out.presupuesto
          : out.presupuesto !== undefined
            ? Number(out.presupuesto)
            : undefined,
    };
  }
}

interface TypeformAnswer {
  field?: { id?: string; ref?: string };
  text?: string;
  email?: string;
  phone_number?: string;
  number?: number;
  choice?: { label?: string };
}

interface TypeformPayload {
  form_response?: { answers?: TypeformAnswer[] };
}
