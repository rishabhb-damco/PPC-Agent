import { useEffect, useState } from 'react'
import { getAgentRoster } from '../services/api'
import { Bot, Circle } from 'lucide-react'

interface Agent {
  id: string
  name: string
  role: string
  status: string
  last_run: string | null
  capabilities: string[]
}

const statusColor: Record<string, string> = {
  idle: 'text-gray-500',
  running: 'text-blue-400',
  completed: 'text-green-400',
  error: 'text-red-400',
  awaiting_approval: 'text-yellow-400',
}

export default function AgentStatusPanel() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    getAgentRoster()
      .then(r => setAgents(r.data.agents))
      .catch(() => {})
  }, [])

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={16} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">9-Agent Roster</h3>
      </div>
      <div className="space-y-2">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-blue-400 w-6">{agent.id.toUpperCase()}</span>
              <div>
                <p className="text-xs font-medium text-gray-200">{agent.name}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[160px]">{agent.capabilities[0]}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs ${statusColor[agent.status] || 'text-gray-500'}`}>
              <Circle size={6} fill="currentColor" />
              <span className="capitalize">{agent.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
