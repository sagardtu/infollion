import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

const initialData = {
  id: "corp",
  label: "Corporation",
  type: "root",
  children: [
    {
      id: "tech",
      label: "Technology",
      children: [
        {
          id: "eng",
          label: "Engineering",
          children: [
            { id: "fe", label: "Frontend" },
            { id: "be", label: "Backend" },
            { id: "devops", label: "DevOps" },
          ],
        },
        {
          id: "product",
          label: "Product",
          children: [
            { id: "design", label: "Design" },
            { id: "pm", label: "Product Mgmt" },
          ],
        },
      ],
    },
    {
      id: "ops",
      label: "Operations",
      children: [
        { id: "hr", label: "HR" },
        { id: "finance", label: "Finance" },
      ],
    },
  ],
};

const CustomNode = ({ data, id }) => {
  const { label, expanded, hasChildren } = data;

  return (
    <div className={`custom-node ${data.isRoot ? "root" : ""}`}>
      <Handle type="target" position={Position.Top} className="handle" />
      <div className="node-content">{label}</div>
      <Handle type="source" position={Position.Bottom} className="handle" />

      {hasChildren && (
        <button
          className="toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("toggleNode", { detail: id }));
          }}
        >
          {expanded ? "-" : "+"}
        </button>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getLayout = (tree, collapsedIds) => {
  const nodes = [];
  const edges = [];
  const nodeWidth = 160;
  let leafIndex = 0;

  const traverse = (node, depth) => {
    const collapsed = collapsedIds.has(node.id);
    const hasChildren = node.children?.length > 0;

    let x;

    if (!hasChildren || collapsed) {
      x = leafIndex * (nodeWidth + 40);
      leafIndex++;
    } else {
      const childXs = node.children.map((c) => traverse(c, depth + 1));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }

    nodes.push({
      id: node.id,
      type: "custom",
      position: { x, y: depth * 120 },
      data: {
        label: node.label,
        expanded: !collapsed,
        hasChildren,
        isRoot: depth === 0,
      },
    });

    if (hasChildren && !collapsed) {
      node.children.forEach((c) => {
        edges.push({
          id: `${node.id}-${c.id}`,
          source: node.id,
          target: c.id,
          type: "step",
        });
      });
    }

    return x;
  };

  traverse(tree, 0);

  const rootNode = nodes.find((n) => n.data.isRoot);
  const TARGET_X = 400; // fixed center position
  const shiftX = TARGET_X - rootNode.position.x;

  nodes.forEach((n) => {
    n.position.x += shiftX;
  });

  return { nodes, edges };
};

export default function App() {
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const toggleNode = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e) => toggleNode(e.detail);
    window.addEventListener("toggleNode", handler);
    return () => window.removeEventListener("toggleNode", handler);
  }, [toggleNode]);

  useEffect(() => {
    const layout = getLayout(initialData, collapsedIds);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [collapsedIds, setNodes, setEdges]);

  return (
    <div className="app-container">
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        ></ReactFlow>
      </div>
    </div>
  );
}
