import { MockLlmProvider } from './providers/mock.provider';
import { Lead } from '../leads/entities/lead.entity';

describe('MockLlmProvider', () => {
  const provider = new MockLlmProvider();

  it('returns a helpful message when there are no leads', async () => {
    const text = await provider.generateSummary([], {});
    expect(text).toContain('No leads');
  });

  it('includes the dominant channel in the summary', async () => {
    const leads: Lead[] = [
      { fuente: 'instagram', presupuesto: 100, createdAt: new Date() } as Lead,
      { fuente: 'instagram', presupuesto: 200, createdAt: new Date() } as Lead,
      { fuente: 'facebook', presupuesto: null, createdAt: new Date() } as Lead,
    ];
    const text = await provider.generateSummary(leads, { fuente: 'instagram' });
    expect(text).toMatch(/instagram/i);
    expect(text).toMatch(/Top channel/i);
    expect(text).toMatch(/Recommendations/i);
  });
});
