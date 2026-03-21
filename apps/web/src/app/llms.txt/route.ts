import { repos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await repos.services.list({ limit: 500 });

    const lines: string[] = [
      '# Agent Exchange — Service Manifest',
      '# Full API: https://agentexchange.dev/api/v1/services',
      '',
    ];

    for (const service of result.data) {
      const protocols = service.protocols.map((p) => p.protocol).join(', ');
      const methods = service.paymentMethods
        .map((m) => `${m.method}:${m.intent}`)
        .join(', ');
      const categories = service.categories.map((c) => c.category).join(', ');

      lines.push(`## ${service.name}`);
      lines.push(`Endpoint: ${service.serviceUrl}`);
      lines.push(`Protocols: ${protocols || 'none'}`);
      lines.push(`Payment: ${methods || 'none'}`);
      lines.push(`Categories: ${categories || 'uncategorized'}`);
      lines.push(`Classification: ${service.dataClassification}`);
      lines.push(`Health: ${service.healthScore}/100`);
      lines.push('');
    }

    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[llms.txt]', err);
    return new Response('# Agent Exchange — Service Manifest\n# Temporarily unavailable\n', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
