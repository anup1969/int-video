import { useState, useRef, useEffect } from 'react';
import {
  answerTypes,
  getDefaultLogicRules,
  updateLogicRulesForAnswerType,
  defaultContactFormFields,
} from '../../lib/utils/constants';
import VideoNode from './VideoNode';
import Sidebar from './Sidebar';
import Header from './Header';
import EditModal from './EditModal';
import PreviewModal from './PreviewModal';
import ZoomControls from './ZoomControls';

export default function FlowBuilder() {
  // State management
  const [nodes, setNodes] = useState([
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 250 },
      label: '▶️ Start Campaign',
    },
    {
      id: '1',
      type: 'video',
      position: { x: 400, y: 200 },
      stepNumber: 1,
      label: 'Welcome Video',
      answerType: 'multiple-choice',
      logicRules: [],
      videoPlaceholder: '👋',
      mcOptions: ['Learn More', 'Schedule Call'],
      buttonOptions: [{ text: 'Continue', target: '', targetType: 'node' }],
      enabledResponseTypes: { video: true, audio: true, text: true },
      showContactForm: false,
      contactFormFields: defaultContactFormFields,
    },
  ]);

  const [connections, setConnections] = useState([]);
  const [scale, setScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('mobile');
  const [activeTab, setActiveTab] = useState('video');
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewStep, setPreviewStep] = useState(0);
  const [editingStep, setEditingStep] = useState({
    label: '',
    answerType: 'open-ended',
    logicRules: [],
    videoUrl: '',
    mcOptions: [],
    buttonOptions: [],
    enabledResponseTypes: { video: true, audio: true, text: true },
    showContactForm: false,
    contactFormFields: defaultContactFormFields,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Zoom handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => {
    setScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isPanning, panStart]);

  // Node handlers
  const handleNodeRename = (nodeId, newLabel) => {
    setNodes(nodes.map((node) => (node.id === nodeId ? { ...node, label: newLabel } : node)));
  };

  const handleNodeDragStart = (e, nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node.type === 'start') {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedNode(nodeId);
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    });
  };

  const handleCanvasDragOver = (e) => e.preventDefault();

  const handleCanvasDrop = (e) => {
    e.preventDefault();

    if (draggedNode) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left - panPosition.x) / scale - dragOffset.x;
      const y = (e.clientY - rect.top - panPosition.y) / scale - dragOffset.y;

      setNodes(
        nodes.map((node) => (node.id === draggedNode ? { ...node, position: { x, y } } : node))
      );
      setDraggedNode(null);
    } else {
      const answerType = e.dataTransfer.getData('answerType');
      if (answerType) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left - panPosition.x) / scale;
        const y = (e.clientY - rect.top - panPosition.y) / scale;

        const newNode = {
          id: Date.now().toString(),
          type: 'video',
          position: { x, y },
          stepNumber: nodes.filter((n) => n.type === 'video').length + 1,
          label: `Step ${nodes.filter((n) => n.type === 'video').length + 1}`,
          answerType: answerType,
          logicRules: getDefaultLogicRules(answerType),
          videoPlaceholder: answerTypes.find((t) => t.id === answerType)?.icon,
          mcOptions: answerType === 'multiple-choice' ? ['Option A', 'Option B'] : [],
          buttonOptions:
            answerType === 'button'
              ? [{ text: 'Continue', target: '', targetType: 'node' }]
              : [],
          enabledResponseTypes: { video: true, audio: true, text: true },
          showContactForm: false,
          contactFormFields: defaultContactFormFields,
        };

        setNodes([...nodes, newNode]);
      }
    }
  };

  const handleSidebarDragStart = (e, answerType) => {
    e.dataTransfer.setData('answerType', answerType);
  };

  const handleEditNode = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditingStep({
        id: nodeId,
        label: node.label,
        answerType: node.answerType,
        logicRules: node.logicRules || [],
        videoUrl: node.videoUrl || '',
        mcOptions: node.mcOptions || [],
        buttonOptions: node.buttonOptions || [{ text: 'Continue', target: '', targetType: 'node' }],
        enabledResponseTypes: node.enabledResponseTypes || { video: true, audio: true, text: true },
        showContactForm: node.showContactForm || false,
        contactFormFields: node.contactFormFields || defaultContactFormFields,
      });
      setShowEditModal(true);
      setSelectedNode(nodeId);
      setActiveTab('video');
    }
  };

  const handleDuplicateNode = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const newNode = {
        ...node,
        id: Date.now().toString(),
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        stepNumber: nodes.filter((n) => n.type === 'video').length + 1,
        label: `${node.label} (Copy)`,
      };
      setNodes([...nodes, newNode]);
    }
  };

  const handleDeleteNode = (nodeId) => {
    if (confirm('Delete this step?')) {
      setNodes(nodes.filter((node) => node.id !== nodeId));
      setConnections(connections.filter((conn) => conn.from !== nodeId && conn.to !== nodeId));
    }
  };

  const handleResponseTypeToggle = (type) => {
    const newEnabledTypes = {
      ...editingStep.enabledResponseTypes,
      [type]: !editingStep.enabledResponseTypes[type],
    };

    const newLogicRules = getDefaultLogicRules('open-ended', newEnabledTypes);

    setEditingStep({
      ...editingStep,
      enabledResponseTypes: newEnabledTypes,
      logicRules: newLogicRules,
    });
  };

  const handleSaveEdit = () => {
    const incompleteRules = editingStep.logicRules.filter((rule) => !rule.target || rule.target === '');

    if (incompleteRules.length > 0) {
      if (
        !confirm(
          `⚠️ Warning: ${incompleteRules.length} logic path(s) are incomplete. Save anyway?`
        )
      ) {
        return;
      }
    }

    setNodes(
      nodes.map((node) =>
        node.id === editingStep.id
          ? {
              ...node,
              label: editingStep.label,
              answerType: editingStep.answerType,
              logicRules: editingStep.logicRules,
              videoUrl: editingStep.videoUrl,
              videoPlaceholder: answerTypes.find((t) => t.id === editingStep.answerType)?.icon,
              mcOptions: editingStep.mcOptions,
              buttonOptions: editingStep.buttonOptions,
              enabledResponseTypes: editingStep.enabledResponseTypes,
              showContactForm: editingStep.showContactForm,
              contactFormFields: editingStep.contactFormFields,
            }
          : node
      )
    );

    const newLogicConnections = editingStep.logicRules
      .filter(
        (rule) =>
          rule.target && rule.target !== 'end' && rule.target !== '' && rule.targetType === 'node'
      )
      .map((rule) => ({
        from: editingStep.id,
        to: rule.target,
        type: 'logic',
      }));

    const otherConnections = connections.filter(
      (conn) => conn.from !== editingStep.id || conn.type !== 'logic'
    );

    setConnections([...otherConnections, ...newLogicConnections]);
    setShowEditModal(false);
  };

  const handleAddStep = () => {
    const newNode = {
      id: Date.now().toString(),
      type: 'video',
      position: { x: 400, y: 100 + nodes.filter((n) => n.type === 'video').length * 200 },
      stepNumber: nodes.filter((n) => n.type === 'video').length + 1,
      label: `New Step ${nodes.filter((n) => n.type === 'video').length + 1}`,
      answerType: 'open-ended',
      logicRules: getDefaultLogicRules('open-ended'),
      videoPlaceholder: '🎬',
      enabledResponseTypes: { video: true, audio: true, text: true },
      showContactForm: false,
      contactFormFields: defaultContactFormFields,
    };
    setNodes([...nodes, newNode]);
  };

  const updateLogicRule = (index, field, value) => {
    const newRules = [...editingStep.logicRules];
    newRules[index][field] = value;
    setEditingStep({ ...editingStep, logicRules: newRules });
  };

  // Multiple Choice handlers
  const addMCOption = () => {
    const newOptions = [...editingStep.mcOptions, `Option ${editingStep.mcOptions.length + 1}`];
    setEditingStep({
      ...editingStep,
      mcOptions: newOptions,
      logicRules: updateLogicRulesForAnswerType(
        'multiple-choice',
        newOptions,
        [],
        editingStep.enabledResponseTypes
      ),
    });
  };

  const updateMCOption = (index, value) => {
    const newOptions = [...editingStep.mcOptions];
    newOptions[index] = value;
    setEditingStep({
      ...editingStep,
      mcOptions: newOptions,
      logicRules: updateLogicRulesForAnswerType(
        'multiple-choice',
        newOptions,
        [],
        editingStep.enabledResponseTypes
      ),
    });
  };

  const removeMCOption = (index) => {
    const newOptions = editingStep.mcOptions.filter((_, i) => i !== index);
    setEditingStep({
      ...editingStep,
      mcOptions: newOptions,
      logicRules: updateLogicRulesForAnswerType(
        'multiple-choice',
        newOptions,
        [],
        editingStep.enabledResponseTypes
      ),
    });
  };

  // Button handlers
  const addButtonOption = () => {
    const newButtons = [...editingStep.buttonOptions, { text: 'New Button', target: '', targetType: 'node' }];
    setEditingStep({
      ...editingStep,
      buttonOptions: newButtons,
      logicRules: updateLogicRulesForAnswerType(
        'button',
        [],
        newButtons,
        editingStep.enabledResponseTypes
      ),
    });
  };

  const updateButtonOption = (index, field, value) => {
    const newOptions = [...editingStep.buttonOptions];
    newOptions[index][field] = value;
    setEditingStep({
      ...editingStep,
      buttonOptions: newOptions,
      logicRules: updateLogicRulesForAnswerType(
        'button',
        [],
        newOptions,
        editingStep.enabledResponseTypes
      ),
    });
  };

  const removeButtonOption = (index) => {
    const newButtons = editingStep.buttonOptions.filter((_, i) => i !== index);
    setEditingStep({
      ...editingStep,
      buttonOptions: newButtons,
      logicRules: updateLogicRulesForAnswerType(
        'button',
        [],
        newButtons,
        editingStep.enabledResponseTypes
      ),
    });
  };

  // Contact form handlers
  const addContactFormField = () => {
    const newFields = [
      ...editingStep.contactFormFields,
      {
        id: `custom_${Date.now()}`,
        label: 'Custom Field',
        type: 'text',
        required: false,
        enabled: true,
      },
    ];
    setEditingStep({ ...editingStep, contactFormFields: newFields });
  };

  const updateContactFormField = (index, field, value) => {
    const newFields = [...editingStep.contactFormFields];
    newFields[index][field] = value;
    setEditingStep({ ...editingStep, contactFormFields: newFields });
  };

  const removeContactFormField = (index) => {
    const newFields = editingStep.contactFormFields.filter((_, i) => i !== index);
    setEditingStep({ ...editingStep, contactFormFields: newFields });
  };

  // Preview handlers
  const getPreviewSteps = () => {
    const videoNodes = nodes.filter((n) => n.type === 'video');
    return videoNodes.length > 0 ? videoNodes : [];
  };

  const handlePreviewNext = () => {
    const steps = getPreviewSteps();
    if (previewStep < steps.length - 1) {
      setPreviewStep(previewStep + 1);
    }
  };

  const handlePreviewPrev = () => {
    if (previewStep > 0) {
      setPreviewStep(previewStep - 1);
    }
  };

  const handlePreviewReset = () => {
    setPreviewStep(0);
  };

  // Draw connections
  const drawConnections = () => {
    return connections.map((conn, idx) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);

      if (!fromNode || !toNode) return null;

      const startX = fromNode.position.x + (fromNode.type === 'start' ? 150 : 240);
      const startY = fromNode.position.y + (fromNode.type === 'start' ? 25 : 100);
      const endX = toNode.position.x;
      const endY = toNode.position.y + 100;

      const midX = (startX + endX) / 2;

      return (
        <path
          key={`${conn.from}-${conn.to}-${idx}`}
          d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
          className={`arrow-line ${conn.type === 'logic' ? 'logic-path' : ''}`}
        />
      );
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        onAddStep={handleAddStep}
        onPreview={() => {
          setShowPreviewModal(true);
          setPreviewStep(0);
        }}
        onSidebarDragStart={handleSidebarDragStart}
      />

      <div className="flex-1 flex flex-col">
        <Header campaignName="Untitled Campaign" scale={scale} />

        <div
          ref={containerRef}
          className="canvas-container flex-1 relative"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          <div
            ref={canvasRef}
            className={`canvas ${isPanning ? 'grabbing' : ''}`}
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${scale})`,
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            <svg
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
                </marker>
              </defs>
              {drawConnections()}
            </svg>

            <div
              className="start-node absolute"
              style={{
                left: nodes[0].position.x,
                top: nodes[0].position.y,
              }}
            >
              {nodes[0].label}
            </div>

            {nodes
              .filter((n) => n.type === 'video')
              .map((node) => (
                <VideoNode
                  key={node.id}
                  node={node}
                  onEdit={handleEditNode}
                  onDelete={handleDeleteNode}
                  onDuplicate={handleDuplicateNode}
                  onDragStart={handleNodeDragStart}
                  onRename={handleNodeRename}
                  selected={selectedNode === node.id}
                />
              ))}
          </div>

          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
          />

          <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <div className="text-sm text-gray-700">
              <div className="font-semibold mb-2">💡 v4 Enhanced:</div>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• Click node titles to rename</li>
                <li>• Contact Form node added</li>
                <li>• Dynamic logic based on settings</li>
                <li>• Mobile/Desktop preview toggle</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <EditModal
        show={showEditModal}
        editingStep={editingStep}
        setEditingStep={setEditingStep}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodes={nodes}
        onSave={handleSaveEdit}
        onClose={() => setShowEditModal(false)}
        onResponseTypeToggle={handleResponseTypeToggle}
        addMCOption={addMCOption}
        updateMCOption={updateMCOption}
        removeMCOption={removeMCOption}
        addButtonOption={addButtonOption}
        updateButtonOption={updateButtonOption}
        removeButtonOption={removeButtonOption}
        addContactFormField={addContactFormField}
        updateContactFormField={updateContactFormField}
        removeContactFormField={removeContactFormField}
        updateLogicRule={updateLogicRule}
      />

      <PreviewModal
        show={showPreviewModal}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        previewStep={previewStep}
        steps={getPreviewSteps()}
        onClose={() => setShowPreviewModal(false)}
        onNext={handlePreviewNext}
        onPrev={handlePreviewPrev}
        onReset={handlePreviewReset}
      />
    </div>
  );
}
