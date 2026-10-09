import { useEffect } from 'react'
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import { getChildren, getParents, type Plans } from '../graph'
import type { Plan } from '../types'
import '@xyflow/react/dist/style.css'

interface FocusGraphProps {
  plans: Plans
  focusedId: string | null
  onFocus: (id: string) => void
  highlightedId?: string | null
}

interface FocusGraphCanvasProps {
  plans: Plans
  focusedId: string
  onFocus: (id: string) => void
  focusedPlan: Plan
  parents: Plan[]
  children: Plan[]
  highlightedId: string | null
}

const columnGap = 300
const rowGap = 110

function PlanNode({ data }: { data: { label: string } }) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

const nodeTypes = { plan: PlanNode }

function makeNode(
  plan: Plan,
  x: number,
  y: number,
  focusedId: string,
  highlightedId: string | null,
): Node {
  const classes = [
    'focus-node',
    plan.id === focusedId ? 'selected' : '',
    plan.id === highlightedId ? 'candidate' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id: plan.id,
    type: 'plan',
    position: { x, y },
    data: { label: `#${plan.id} ${plan.title}` },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    className: classes,
  }
}

function FocusGraphCanvas({
  plans,
  focusedId,
  onFocus,
  focusedPlan,
  parents,
  children,
  highlightedId,
}: FocusGraphCanvasProps) {
  const { fitView } = useReactFlow()
  const nodes: Node[] = [
    ...parents.map((plan, index) =>
      makeNode(plan, 0, index * rowGap, focusedId, highlightedId),
    ),
    makeNode(focusedPlan, columnGap, 0, focusedId, highlightedId),
    ...children.map((plan, index) =>
      makeNode(plan, columnGap * 2, index * rowGap, focusedId, highlightedId),
    ),
  ]
  const edges: Edge[] = [
    ...parents.map((parent) => ({
      id: `${parent.id}-${focusedId}`,
      source: parent.id,
      target: focusedId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    })),
    ...children.map((child) => ({
      id: `${focusedId}-${child.id}`,
      source: focusedId,
      target: child.id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    })),
  ]

  useEffect(() => {
    void fitView({ duration: 300, padding: 0.2 })
  }, [fitView, focusedId, plans])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      onNodeClick={(_, node) => onFocus(node.id)}
    >
      <Background gap={24} size={1} />
    </ReactFlow>
  )
}

export function FocusGraph({
  plans,
  focusedId,
  onFocus,
  highlightedId = null,
}: FocusGraphProps) {
  if (!focusedId || !plans[focusedId]) {
    return <p className="graph-empty">Select a plan to see its connections.</p>
  }

  const focusedPlan = plans[focusedId]
  const parents = getParents(plans, focusedId)
  const children = getChildren(plans, focusedId)

  return (
    <div className="focus-graph" aria-label="Focused plan graph">
      <ReactFlowProvider>
        <FocusGraphCanvas
          plans={plans}
          focusedId={focusedId}
          onFocus={onFocus}
          focusedPlan={focusedPlan}
          parents={parents}
          children={children}
          highlightedId={highlightedId}
        />
      </ReactFlowProvider>
    </div>
  )
}
