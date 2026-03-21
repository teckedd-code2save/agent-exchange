import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">Agent Exchange</h1>
        <p className="text-xl text-gray-400">
          A protocol-native marketplace where AI agents discover and pay for third-party services.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            Operator Dashboard
          </Link>
          <Link
            href="/api/v1/services"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium transition-colors"
          >
            Browse API
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-12 text-left">
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="font-semibold mb-2">Register Services</h3>
            <p className="text-sm text-gray-400">List your API, MCP server, or OpenAPI spec for agents to discover</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="font-semibold mb-2">Agent-Native Payments</h3>
            <p className="text-sm text-gray-400">MPP 402 protocol with Tempo (USDC) and Stripe support</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="font-semibold mb-2">Real-time Discovery</h3>
            <p className="text-sm text-gray-400">pg_trgm search with health scoring and SLA monitoring</p>
          </div>
        </div>
      </div>
    </main>
  );
}
