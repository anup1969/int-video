import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
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
  const router = useRouter();
  // Campaign & Save State
  const [campaignId, setCampaignId] = useState(null);
  const [campaignName, setCampaignName] = useState('Untitled Campaign');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State management
  const [nodes, setNodes] = useState([
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 250 },
      label: '▶️ Start Campaign',
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
    buttonShowTime: 0,
    enabledResponseTypes: { video: true, audio: true, text: true },
    showContactForm: false,
    contactFormFields: defaultContactFormFields,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Add builder-page class to body
  useEffect(() => {
    document.body.classList.add('builder-page');
    return () => {
      document.body.classList.remove('builder-page');
    };
  }, []);

  // Load campaign from URL on mount
  useEffect(() => {
    const loadCampaignFromURL = async () => {
      const { id } = router.query;
      if (!id) return;

      try {
        const response = await fetch(`/api/campaigns/${id}`);
        if (response.ok) {
          const { campaign, steps, connections: loadedConnections } = await response.json();

          console.log('Loading campaign:', {
            campaignId: campaign.id,
            stepCount: steps?.length,
            connectionCount: loadedConnections?.length
          });

          setCampaignId(campaign.id);
          setCampaignName(campaign.name);

          // Convert steps to nodes format
          if (steps && steps.length > 0) {
            const loadedNodes = [
              {
                id: 'start',
                type: 'start',
                position: { x: 100, y: 250 },
                label: '▶️ Start Campaign',
              },
              ...steps.map(step => ({
                id: step.id,
                type: 'video',
                position: step.data?.position || { x: 400, y: 200 },
                stepNumber: step.step_number,
                label: step.label,
                answerType: step.answer_type,
                logicRules: step.data?.logicRules || [],
                videoUrl: step.data?.videoUrl || null,
                videoThumbnail: step.data?.videoThumbnail || null,
                videoPlaceholder: step.data?.videoPlaceholder || '🎬',
                mcOptions: step.data?.mcOptions || [],
                buttonOptions: step.data?.buttonOptions || [],
                buttonShowTime: step.data?.buttonShowTime || 0,
                enabledResponseTypes: step.data?.enabledResponseTypes || { video: true, audio: true, text: true },
                showContactForm: step.data?.showContactForm || false,
                contactFormFields: step.data?.contactFormFields || defaultContactFormFields,
              }))
            ];

            // Convert connections to use database UUIDs
            const formattedConnections = (loadedConnections || []).map(conn => ({
              from: conn.from_step || 'start',
              to: conn.to_step,
              type: conn.connection_type || 'logic'
            }));

            setNodes(loadedNodes);
            setConnections(formattedConnections);

            console.log('Campaign loaded:', {
              nodeCount: loadedNodes.length,
              connectionCount: formattedConnections.length
            });
          }
        }
      } catch (error) {
        console.error('Failed to load campaign:', error);
      }
    };

    if (router.isReady) {
      loadCampaignFromURL();
    }
  }, [router.isReady, router.query]);

  // Save Campaign Function
  const saveCampaign = async () => {
    try {
      setSaveStatus('saving');

      // If no campaign ID, create new campaign first
      if (!campaignId) {
        const createRes = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: campaignName,
            status: 'draft'
          })
        });

        if (!createRes.ok) throw new Error('Failed to create campaign');
        
        const { campaign } = await createRes.json();
        setCampaignId(campaign.id);
        
        // Save the campaign state
        await saveCampaignState(campaign.id);
      } else {
        // Update existing campaign
        await saveCampaignState(campaignId);
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveCampaignState = async (id) => {
    const videoNodes = nodes.filter(n => n.type === 'video');

    console.log('💾 Saving campaign state:');
    console.log('  Total nodes:', nodes.length);
    console.log('  Video nodes:', videoNodes.length);
    console.log('  Video nodes details:', videoNodes.map(n => ({
      stepNumber: n.stepNumber,
      label: n.label,
      hasVideo: !!n.videoUrl,
      videoUrl: n.videoUrl
    })));

    const response = await fetch(`/api/campaigns/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: videoNodes, // Don't save start node
        connections,
        settings: { name: campaignName }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Save failed:', response.status, errorData);
      throw new Error(errorData.error || 'Failed to save campaign state');
    }

    return response.json();
  };

  // Load Campaign Function
  const loadCampaign = async (id) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      
      if (!response.ok) throw new Error('Failed to load campaign');
      
      const { campaign, steps, connections: loadedConnections } = await response.json();

      // Set campaign info
      setCampaignId(campaign.id);
      setCampaignName(campaign.name);

      // Convert steps to nodes
      const loadedNodes = [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 250 },
          label: '▶️ Start Campaign',
        },
        ...steps.map(step => ({
          id: step.id,
          type: 'video',
          position: step.data?.position || { x: 400, y: 200 },
          stepNumber: step.step_number,
          label: step.label,
          answerType: step.answer_type,
          logicRules: step.data?.logicRules || [],
          videoUrl: step.data?.videoUrl || null,
          videoThumbnail: step.data?.videoThumbnail || null,
          videoPlaceholder: step.data?.videoPlaceholder || '🎬',
          mcOptions: step.data?.mcOptions || [],
          buttonOptions: step.data?.buttonOptions || [],
          buttonShowTime: step.data?.buttonShowTime || 0,
          enabledResponseTypes: step.data?.enabledResponseTypes || { video: true, audio: true, text: true },
          showContactForm: step.data?.showContactForm || false,
          contactFormFields: step.data?.contactFormFields || defaultContactFormFields,
        }))
      ];

      // Convert connections
      const formattedConnections = loadedConnections.map(conn => ({
        from: conn.from_step_id,
        to: conn.to_step_id,
        type: conn.connection_type
      }));

      setNodes(loadedNodes);
      setConnections(formattedConnections);
      setHasUnsavedChanges(false);
      
      console.log(`✅ Loaded campaign: ${campaign.name}`);
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load campaign');
    }
  };

  // Auto-save effect
  useEffect(() => {
    // Don't auto-save if no campaign ID yet
    if (!campaignId) return;
    
    // Don't auto-save if no changes
    if (!hasUnsavedChanges) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 30 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      console.log('🔄 Auto-saving...');
      saveCampaign();
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, connections, campaignId, hasUnsavedChanges]);

  // Mark as having unsaved changes when nodes or connections change
  useEffect(() => {

    if (campaignId) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections]);


  // Zoom handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => {
    setScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Sidebar toggle handler
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
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

        const mcOptions = answerType === 'multiple-choice' ? ['Option A', 'Option B'] : [];
        const buttonOptions = answerType === 'button' ? [{ text: 'Continue', target: '', targetType: 'node' }] : [];

        // Generate appropriate logic rules based on answer type
        let logicRules;
        if (answerType === 'multiple-choice') {
          logicRules = updateLogicRulesForAnswerType('multiple-choice', mcOptions, [], { video: true, audio: true, text: true });
        } else if (answerType === 'button') {
          logicRules = updateLogicRulesForAnswerType('button', [], buttonOptions, { video: true, audio: true, text: true });
        } else {
          logicRules = getDefaultLogicRules(answerType);
        }

        const newNode = {
          id: uuidv4(),
          type: 'video',
          position: { x, y },
          stepNumber: nodes.filter((n) => n.type === 'video').length + 1,
          label: `Step ${nodes.filter((n) => n.type === 'video').length + 1}`,
          answerType: answerType,
          logicRules: logicRules,
          videoPlaceholder: answerTypes.find((t) => t.id === answerType)?.icon,
          mcOptions: mcOptions,
          buttonOptions: buttonOptions,
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
      // Ensure logic rules are up-to-date with current answer type and options
      let logicRules = node.logicRules || [];

      // Initialize mcOptions with defaults if multiple-choice and empty
      const mcOptionsToUse = node.answerType === 'multiple-choice' && (!node.mcOptions || node.mcOptions.length === 0)
        ? ['Option A', 'Option B']
        : (node.mcOptions || []);

      // Regenerate logic rules if they're empty or outdated
      if (logicRules.length === 0 || !node.logicRules) {
        const buttonOptions = node.buttonOptions || [{ text: 'Continue', target: '', targetType: 'node' }];
        const enabledResponseTypes = node.enabledResponseTypes || { video: true, audio: true, text: true };

        if (node.answerType === 'multiple-choice') {
          logicRules = updateLogicRulesForAnswerType('multiple-choice', mcOptionsToUse, [], enabledResponseTypes);
        } else if (node.answerType === 'button') {
          logicRules = updateLogicRulesForAnswerType('button', [], buttonOptions, enabledResponseTypes);
        } else {
          logicRules = getDefaultLogicRules(node.answerType, enabledResponseTypes);
        }
      }

      // Update the node with initialized values if they were empty
      if (node.answerType === 'multiple-choice' && (!node.mcOptions || node.mcOptions.length === 0)) {
        setNodes(nodes.map(n =>
          n.id === nodeId
            ? { ...n, mcOptions: mcOptionsToUse, logicRules: logicRules }
            : n
        ));
      }

      setEditingStep({
        id: nodeId,
        label: node.label,
        answerType: node.answerType,
        logicRules: logicRules,
        videoUrl: node.videoUrl || '',
        mcOptions: mcOptionsToUse,
        buttonOptions: node.buttonOptions || [{ text: 'Continue', target: '', targetType: 'node' }],
        buttonShowTime: node.buttonShowTime || 0,
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
        id: uuidv4(),
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
              buttonShowTime: editingStep.buttonShowTime || 0,
              enabledResponseTypes: editingStep.enabledResponseTypes,
              showContactForm: editingStep.showContactForm,
              contactFormFields: editingStep.contactFormFields,
              slideType: editingStep.slideType || 'video',
              textContent: editingStep.textContent || '',
              backgroundColor: editingStep.backgroundColor || '',
              fontFamily: editingStep.fontFamily || '',
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
      id: uuidv4(),
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

  // Answer Type Change Handler
  const handleAnswerTypeChange = (newAnswerType) => {
    // Calculate new logic rules based on the new answer type
    let newLogicRules;

    if (newAnswerType === 'multiple-choice') {
      newLogicRules = updateLogicRulesForAnswerType(
        newAnswerType,
        editingStep.mcOptions || ['Option A', 'Option B'],
        [],
        editingStep.enabledResponseTypes
      );
    } else if (newAnswerType === 'button') {
      newLogicRules = updateLogicRulesForAnswerType(
        newAnswerType,
        [],
        editingStep.buttonOptions || [{ text: 'Continue', target: '', targetType: 'node' }],
        editingStep.enabledResponseTypes
      );
    } else {
      newLogicRules = getDefaultLogicRules(newAnswerType, editingStep.enabledResponseTypes);
    }

    setEditingStep({
      ...editingStep,
      answerType: newAnswerType,
      logicRules: newLogicRules,
    });
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
        id: `custom_${uuidv4()}`,
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div className="flex-1 flex flex-col">
        <Header campaignName={campaignName} scale={scale} onSave={saveCampaign} saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} campaignId={campaignId} />

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
        onAnswerTypeChange={handleAnswerTypeChange}
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
        nodes={nodes}
        connections={connections}
        onClose={() => setShowPreviewModal(false)}
        onNext={handlePreviewNext}
        onPrev={handlePreviewPrev}
        onReset={handlePreviewReset}
      />
    </div>
  );
}
