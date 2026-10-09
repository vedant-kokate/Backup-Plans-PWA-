import { useEffect, useRef, useState } from 'react'
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
import { useHotkeys } from '../hooks/useHotkeys'
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
  highlightedId: string | null
}

interface VisiblePlan {
  plan: Plan
  distance: number
  column: number
}

interface ScreenSize {
  width: number
  height: number
}

const columnGap = 300
const rowGap = 110
const maxGraphDistance = 6

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

function getVisibleDistance(zoom: number, screenSize: ScreenSize): number {
  const widthFactor = Math.min(1.5, Math.max(0.65, screenSize.width / 1100))
  const heightFactor = Math.min(1.35, Math.max(0.7, screenSize.height / 800))
  const screenFactor = Math.min(widthFactor, heightFactor)
  const effectiveZoom = zoom / screenFactor

  if (effectiveZoom >= 0.85) return 1
  if (effectiveZoom >= 0.65) return 2
  if (effectiveZoom >= 0.5) return 3
  if (effectiveZoom >= 0.38) return 4
  if (effectiveZoom >= 0.28) return 5
  return maxGraphDistance
}

function getNeighborhood(
  plans: Plans,
  focusedId: string,
  maxDistance: number,
): Map<string, { distance: number; column: number }> {
  const neighborhood = new Map<string, { distance: number; column: number }>()
  const visited = new Set([focusedId])
  const pending: Array<{
    id: string
    distance: number
    column: number
  }> = [{ id: focusedId, distance: 0, column: 0 }]

  while (pending.length > 0) {
    const current = pending.shift()

    if (!current || current.distance >= maxDistance) {
      continue
    }

    const parentNeighbors = getParents(plans, current.id).map((plan) => ({
      plan,
      column: current.column - 1,
    }))
    const childNeighbors = getChildren(plans, current.id).map((plan) => ({
      plan,
      column: current.column + 1,
    }))

    for (const neighbor of [...parentNeighbors, ...childNeighbors]) {
      const distance = current.distance + 1

      if (visited.has(neighbor.plan.id)) {
        continue
      }

      visited.add(neighbor.plan.id)
      neighborhood.set(neighbor.plan.id, { distance, column: neighbor.column })
      pending.push({ id: neighbor.plan.id, distance, column: neighbor.column })
    }
  }

  return neighborhood
}

function getVisiblePlans(
  plans: Plans,
  focusedId: string,
  maxDistance: number,
): Map<string, VisiblePlan> {
  const visiblePlans = new Map<string, VisiblePlan>()
  const neighborhood = getNeighborhood(plans, focusedId, maxDistance)

  for (const [id, { distance, column }] of neighborhood) {
    const plan = plans[id]

    if (plan) {
      visiblePlans.set(id, { plan, distance, column })
    }
  }

  const focusedPlan = plans[focusedId]

  if (focusedPlan) {
    visiblePlans.set(focusedId, { plan: focusedPlan, distance: 0, column: 0 })
  }

  return visiblePlans
}

function getNodePosition(
  visiblePlan: VisiblePlan,
  index: number,
  columnCount: number,
): { x: number; y: number } {
  const x = visiblePlan.column * columnGap
  const y =
    visiblePlan.column === 0 && visiblePlan.distance === 0
      ? 0
      : (index - (columnCount - 1) / 2) * rowGap

  return { x, y }
}

function makeNode(
  visiblePlan: VisiblePlan,
  x: number,
  y: number,
  focusedId: string,
  highlightedId: string | null,
): Node {
  const classes = [
    'focus-node',
    visiblePlan.plan.id === focusedId ? 'selected' : '',
    visiblePlan.plan.id === highlightedId ? 'candidate' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id: visiblePlan.plan.id,
    type: 'plan',
    position: { x, y },
    data: { label: `#${visiblePlan.plan.id} ${visiblePlan.plan.title}` },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    className: classes,
  }
}

function FocusGraphCanvas({
  plans,
  focusedId,
  onFocus,
  highlightedId,
}: FocusGraphCanvasProps) {
  const { fitView, getZoom, zoomIn, zoomOut } = useReactFlow()
  const [zoom, setZoom] = useState(1)
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const visibleDistance = getVisibleDistance(zoom, screenSize)
  const visiblePlans = getVisiblePlans(plans, focusedId, visibleDistance)
  const columns = new Map<number, VisiblePlan[]>()

  for (const visiblePlan of visiblePlans.values()) {
    const column = visiblePlan.column
    const columnPlans = columns.get(column) ?? []
    columns.set(column, [...columnPlans, visiblePlan])
  }

  const nodes: Node[] = [...visiblePlans.values()].map((visiblePlan) => {
    const column = visiblePlan.column
    const columnPlans = columns.get(column) ?? []
    const index = columnPlans.findIndex(({ plan }) => plan.id === visiblePlan.plan.id)
    const position = getNodePosition(visiblePlan, index, columnPlans.length)

    return makeNode(
      visiblePlan,
      position.x,
      position.y,
      focusedId,
      highlightedId,
    )
  })
  const edges: Edge[] = []

  for (const visiblePlan of visiblePlans.values()) {
    for (const parentId of visiblePlan.plan.parents) {
      if (visiblePlans.has(parentId)) {
        edges.push({
          id: `${parentId}-${visiblePlan.plan.id}`,
          source: parentId,
          target: visiblePlan.plan.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        })
      }
    }
  }

  useEffect(() => {
    void fitView({ duration: 300, padding: 0.2 }).then(() => {
      setZoom(getZoom())
    })
  }, [fitView, focusedId, getZoom, plans, screenSize.height, screenSize.width])

  useEffect(() => {
    function handleResize(): void {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useHotkeys({
    '+': () => {
      void zoomIn({ duration: 200 })
    },
    '-': () => {
      void zoomOut({ duration: 200 })
    },
    '0': () => {
      void fitView({ duration: 300, padding: 0.2 })
    },
  })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      minZoom={0.15}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      onMove={(_, viewport) => setZoom(viewport.zoom)}
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
  const graphRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function handleFullscreenChange(): void {
      setIsFullscreen(document.fullscreenElement === graphRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await graphRef.current?.requestFullscreen()
      }
    } catch {
      setIsFullscreen(false)
    }
  }

  if (!focusedId || !plans[focusedId]) {
    return <p className="graph-empty">Select a plan to see its connections.</p>
  }

  return (
    <div ref={graphRef} className="focus-graph" aria-label="Focused plan graph">
      <button
        type="button"
        className="graph-fullscreen-button"
        onClick={() => void toggleFullscreen()}
        aria-label={isFullscreen ? 'Exit full screen' : 'Make graph full screen'}
        aria-pressed={isFullscreen}
      >
        {isFullscreen ? 'Exit full screen' : 'Full screen'}
      </button>
      <ReactFlowProvider>
        <FocusGraphCanvas
          plans={plans}
          focusedId={focusedId}
          onFocus={onFocus}
          highlightedId={highlightedId}
        />
      </ReactFlowProvider>
    </div>
  )
}
