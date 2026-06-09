'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, post, del, getApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { ApiKey } from '@/types';
import toast from 'react-hot-toast';
import { Key, Copy, Plus, Trash2, Eye, EyeOff, BookOpen, ArrowRight, Code, Globe, Shield, Server, ChevronDown, Check } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const tabs = [
  { id: 'keys', label: 'API Keys', icon: Key },
  { id: 'docs', label: 'Integration Guide', icon: BookOpen },
];

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <button onClick={copy} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 pt-8 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function EndpointCard({ method, path, description, queryParams }: { method: string; path: string; description: string; queryParams?: { name: string; type: string; description: string }[] }) {
  const methodColors: Record<string, string> = { GET: 'text-green-500', POST: 'text-blue-500', DELETE: 'text-red-500', PATCH: 'text-yellow-500' };
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <span className={`text-xs font-bold font-mono uppercase ${methodColors[method] || 'text-gray-500'}`}>{method}</span>
        <code className="text-sm font-mono text-gray-800">{path}</code>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-gray-600">{description}</p>
        {queryParams && queryParams.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Query Parameters</p>
            <div className="space-y-1">
              {queryParams.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700 whitespace-nowrap">{p.name}</code>
                  <span className="text-xs text-gray-400 font-mono">{p.type}</span>
                  <span className="text-gray-500">{p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiIntegrationPage() {
  const [activeTab, setActiveTab] = useState('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<string[]>(['getting-started']);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<ApiKey[]>('/api-keys');
      setKeys(data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const data = await post<ApiKey>('/api-keys', { name: keyName });
      setNewKey(data.plainKey || '');
      setKeyName('');
      fetchKeys();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    try {
      await del(`/api-keys/${key.id}`);
      toast.success('API key revoked');
      fetchKeys();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setNewKey(null);
    setKeyName('');
  };

  const toggleDoc = (id: string) => {
    setExpandedDocs((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">API Integration</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'keys' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Manage API keys for third-party integration. Keys are prefixed with <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">ta_</code>.</p>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Generate Key
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" label="Loading API keys..." />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No API Keys</h3>
              <p className="text-sm text-gray-500 mb-4">Generate a key so third-party services can access your travel data.</p>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Generate Key
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Key Prefix</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Used</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{key.name}</td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">{key.keyPrefix}...</code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={key.isActive ? 'success' : 'danger'} size="sm">
                          {key.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {key.isActive && (
                          <Button variant="danger" size="sm" onClick={() => handleRevoke(key)} title="Revoke key">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Integrate your travel services with third-party platforms using our public API. All endpoints require an API key.</p>

          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleDoc('getting-started')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Code className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium text-gray-900">Getting Started</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDocs.includes('getting-started') ? 'rotate-180' : ''}`} />
              </button>
              {expandedDocs.includes('getting-started') && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Step 1:</strong> Generate an API key from the <button onClick={() => setActiveTab('keys')} className="text-primary-600 underline font-medium">API Keys tab</button>.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Step 2: Send your API key in requests</p>
                    <p className="text-sm text-gray-500 mb-2">Include your API key in the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">X-API-Key</code> header:</p>
                    <CodeBlock code={`curl -H "X-API-Key: ta_your_key_here" ${BASE_URL}/public/destinations`} />
                    <p className="text-sm text-gray-500 mt-2">Or as a Bearer token:</p>
                    <CodeBlock code={`curl -H "Authorization: Bearer ta_your_key_here" ${BASE_URL}/public/destinations`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Step 3: Use the response</p>
                    <p className="text-sm text-gray-500 mb-2">All responses follow this format:</p>
                    <CodeBlock lang="json" code={`{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleDoc('endpoints')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">API Endpoints</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDocs.includes('endpoints') ? 'rotate-180' : ''}`} />
              </button>
              {expandedDocs.includes('endpoints') && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-sm text-gray-500">Base URL: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">{BASE_URL}/public</code></p>
                  <EndpointCard method="GET" path="/destinations" description="List all active destinations." />
                  <EndpointCard method="GET" path="/flights" description="List active flights with seat classes and destination info." queryParams={[
                    { name: 'destination_id', type: 'uuid', description: 'Filter by destination' },
                    { name: 'page', type: 'number', description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', description: 'Items per page (default: 10)' },
                  ]} />
                  <EndpointCard method="GET" path="/hotels" description="List active hotels with room types and destination info." queryParams={[
                    { name: 'destination_id', type: 'uuid', description: 'Filter by destination' },
                    { name: 'page', type: 'number', description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', description: 'Items per page (default: 10)' },
                  ]} />
                  <EndpointCard method="GET" path="/tours" description="List active tours with destination info." queryParams={[
                    { name: 'destination_id', type: 'uuid', description: 'Filter by destination' },
                    { name: 'page', type: 'number', description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', description: 'Items per page (default: 10)' },
                  ]} />
                  <EndpointCard method="GET" path="/bookings" description="List bookings made with this API key." queryParams={[
                    { name: 'status', type: 'string', description: 'Filter by status (pending, confirmed, cancelled, completed)' },
                    { name: 'page', type: 'number', description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', description: 'Items per page (default: 10)' },
                  ]} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleDoc('examples')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Server className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Code Examples</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDocs.includes('examples') ? 'rotate-180' : ''}`} />
              </button>
              {expandedDocs.includes('examples') && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">JavaScript / Fetch</p>
                    <CodeBlock lang="js" code={`const API_KEY = 'ta_your_key_here';
const BASE = '${BASE_URL}/public';

async function getFlights(destinationId) {
  const params = new URLSearchParams();
  if (destinationId) params.set('destination_id', destinationId);
  params.set('limit', '20');

  const res = await fetch(\`$\{BASE}/flights?$\{params}\`, {
    headers: { 'X-API-Key': API_KEY }
  });

  const { success, data, pagination } = await res.json();
  if (!success) throw new Error('API request failed');
  return { flights: data, pagination };
}

// Usage
getFlights().then(({ flights }) => {
  console.log(\`Found $\{flights.length} flights\`);
});`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Python</p>
                    <CodeBlock lang="python" code={`import requests

API_KEY = 'ta_your_key_here'
BASE_URL = '${BASE_URL}/public'

def get_destinations():
    response = requests.get(
        f'{BASE_URL}/destinations',
        headers={'X-API-Key': API_KEY}
    )
    data = response.json()
    if data['success']:
        return data['data']
    raise Exception('API request failed')

def get_hotels(destination_id=None, page=1, limit=10):
    params = {'page': page, 'limit': limit}
    if destination_id:
        params['destination_id'] = destination_id

    response = requests.get(
        f'{BASE_URL}/hotels',
        headers={'X-API-Key': API_KEY},
        params=params
    )
    data = response.json()
    if data['success']:
        return data['data'], data.get('pagination')
    raise Exception('API request failed')

# Example
destinations = get_destinations()
print(f"Found {len(destinations)} destinations")`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">cURL</p>
                    <CodeBlock code={`# List all destinations
curl -H "X-API-Key: ta_your_key_here" \\
  ${BASE_URL}/public/destinations

# List flights with pagination
curl -H "X-API-Key: ta_your_key_here" \\
  "${BASE_URL}/public/flights?page=1&limit=5"

# Filter hotels by destination
curl -H "X-API-Key: ta_your_key_here" \\
  "${BASE_URL}/public/hotels?destination_id=UUID_HERE"`} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggleDoc('best-practices')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-gray-900">Best Practices</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDocs.includes('best-practices') ? 'rotate-180' : ''}`} />
              </button>
              {expandedDocs.includes('best-practices') && (
                <div className="px-4 pb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Keep keys secure</strong> — Never expose your API key in client-side code, version control, or public repositories.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Rotate keys periodically</strong> — Generate new keys and revoke old ones on a regular schedule.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Use descriptive names</strong> — Name your keys by environment (e.g., "Production", "Staging") so you can identify them easily.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Monitor usage</strong> — Check the "Last Used" column to identify unused keys and revoke them.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Handle errors gracefully</strong> — Always check the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">success</code> field in API responses.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={closeCreate} title={newKey ? 'API Key Generated' : 'Generate API Key'} size="md">
        {newKey ? (
          <div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
              <p className="text-sm font-medium text-amber-800 mb-1">Save this key — it won&apos;t be shown again!</p>
              <p className="text-xs text-amber-700">You won&apos;t be able to view this key after closing this dialog. Store it securely.</p>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 text-sm bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 font-mono break-all">
                {visibleKey === newKey ? newKey : newKey.slice(0, 10) + '...'}
              </code>
              <Button variant="ghost" size="sm" onClick={() => setVisibleKey(visibleKey === newKey ? null : newKey)}>
                {visibleKey === newKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="primary" size="sm" onClick={() => copyKey(newKey)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" fullWidth onClick={closeCreate}>Done</Button>
          </div>
        ) : (
          <div>
            <Input label="Key Name" placeholder="e.g. Production, Staging, Test" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <Button variant="primary" onClick={handleCreate} loading={creating} disabled={!keyName.trim()}>
                Generate
              </Button>
              <Button variant="outline" onClick={closeCreate}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}