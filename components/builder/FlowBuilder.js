import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import {
  answerTypes,
  getDefaultLogicRules,
  updateLogicRulesForAnswerType,
  defaultContactFormFields,
} from '../../lib/utils/constants';
import { generatePassword } from '../../lib/utils/password';
import VideoNode from './VideoNode';
import Sidebar from './Sidebar';
import Header from './Header';
import EditModal from './EditModal';
import PreviewModal from './PreviewModal';
import ZoomControls from './ZoomControls';
import { supabase } from '../../lib/supabase';
import TemplatesModal from '../TemplatesModal';

// Helper functions for IST timezone conversion
const convertUTCtoIST = (utcDateString) => {
  if (!utcDateString) return '';
  // Parse the UTC date from database
  const date = new Date(utcDateString);
  // Convert to IST and format for datetime-local input (which expects local time)
  // We need to get the IST time as a string in YYYY-MM-DDTHH:mm format
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const convertISTtoUTC = (istDatetimeLocal) => {
  if (!istDatetimeLocal) return null;
  // The datetime-local value is in format YYYY-MM-DDTHH:mm
  // We need to treat this as IST and convert to UTC
  const [datePart, timePart] = istDatetimeLocal.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');

  // Create a date string that explicitly includes IST offset (+05:30)
  const istString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
  const date = new Date(istString);

  // Return ISO string (UTC)
  return date.toISOString();
};

export default function FlowBuilder() {
  const router = useRouter();
  // Campaign & Save State
  const [campaignId, setCampaignId] = useState(null);
  const [campaignName, setCampaignName] = useState('Untitled Campaign');
  const [usageLimit, setUsageLimit] = useState(null);
  const [scheduleStart, setScheduleStart] = useState(null);
  const [scheduleEnd, setScheduleEnd] = useState(null);
  const [password, setPassword] = useState(null); // Campaign password protection
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [suggestedName, setSuggestedName] = useState('');

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
          if (campaign.usage_limit) {
            setUsageLimit(campaign.usage_limit);
          }
          if (campaign.schedule_start) {
            setScheduleStart(convertUTCtoIST(campaign.schedule_start));
          }
          if (campaign.schedule_end) {
            setScheduleEnd(convertUTCtoIST(campaign.schedule_end));
          }
          if (campaign.password) {
            setPassword(campaign.password);
          }

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
                answerType: step.answer_type || 'open-ended',
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
      // Check if campaign name is "Untitled Campaign" (case-insensitive)
      const isUntitled = campaignName.trim().toLowerCase() === 'untitled campaign';
      
      if (isUntitled && !showRenameDialog) {
        // First, get a suggested name from the API
        const { data: allCampaigns } = await supabase
          .from('campaigns')
          .select('name')
          .order('created_at', { ascending: false});

        // Find highest "Campaign N" number
        let highestNum = 0;
        if (allCampaigns) {
          allCampaigns.forEach(camp => {
            const match = camp.name.match(/^Campaign (d+)$/i);
            if (match) {
              const num = parseInt(match[1]);
              if (num > highestNum) highestNum = num;
            }
          });
        }

        // Set suggested name
        setSuggestedName('Campaign ' + (highestNum + 1));
        setShowRenameDialog(true);
        return; // Don't save yet, wait for user action
      }

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
      
      // Check if it's a duplicate name error
      if (error.message && error.message.includes('already exists')) {
        alert(error.message);
      } else {
        alert(`Save Failed: ${error.message}

Check console for details.`);
      }
      
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
        settings: {
          name: campaignName,
          usageLimit,
          scheduleStart: convertISTtoUTC(scheduleStart),
          scheduleEnd: convertISTtoUTC(scheduleEnd),
          password
        }
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
      if (campaign.usage_limit) {
        setUsageLimit(campaign.usage_limit);
      }
      if (campaign.schedule_start) {
        setScheduleStart(campaign.schedule_start);
      }
      if (campaign.schedule_end) {
        setScheduleEnd(campaign.schedule_end);
      }

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
        from: conn.from_step,
        to: conn.to_step,
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

  // Handle Template Selection
  const handleSelectTemplate = (template) => {
    if (!template || !template.steps) return;

    try {
      // Convert template steps to nodes
      const templateNodes = template.steps.map((step, index) => ({
        id: uuidv4(),
        type: 'video',
        position: { x: 400 + (index % 3) * 300, y: 200 + Math.floor(index / 3) * 200 },
        stepNumber: index + 1,
        label: step.config?.question || step.config?.title || step.config?.message || `Step ${index + 1}`,
        answerType: step.type,
        logicRules: [],
        videoUrl: null,
        videoThumbnail: null,
        videoPlaceholder: '🎬',
        mcOptions: step.config?.options || [],
        buttonOptions: step.config?.buttons || [],
        buttonShowTime: 0,
        enabledResponseTypes: { video: true, audio: true, text: true },
        showContactForm: step.type === 'contact-form',
        contactFormFields: step.config?.fields || defaultContactFormFields,
        slideType: 'video',
        textContent: '',
        backgroundColor: '',
        fontFamily: '',
      }));

      // Add start node
      const newNodes = [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 250 },
          label: '▶️ Start Campaign',
        },
        ...templateNodes
      ];

      // Create linear connections (start → step1 → step2 → ... )
      const newConnections = [];
      for (let i = 0; i < newNodes.length - 1; i++) {
        newConnections.push({
          from: newNodes[i].id,
          to: newNodes[i + 1].id,
          type: 'default'
        });
      }

      setNodes(newNodes);
      setConnections(newConnections);
      setHasUnsavedChanges(true);

      console.log(`✅ Loaded template: ${template.name} with ${templateNodes.length} steps`);
    } catch (error) {
      console.error('Template load error:', error);
      alert('Failed to load template');
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
        slideType: node.slideType || 'video',
        textContent: node.textContent || '',
        backgroundColor: node.backgroundColor || '',
        fontFamily: node.fontFamily || '',
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
    <>
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
        <Header
          campaignName={campaignName}
          scale={scale}
          onSave={saveCampaign}
          saveStatus={saveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          campaignId={campaignId}
          onOpenSettings={() => setShowSettingsModal(true)}
          onTemplatesClick={() => setShowTemplatesModal(true)}
        />

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

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Campaign Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Limit (Optional)
                  <span className="text-gray-500 font-normal ml-2">
                    Limit unique visitors
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited views"
                  value={usageLimit || ''}
                  onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {usageLimit && (
                  <p className="text-sm text-gray-600 mt-1">
                    Campaign will be disabled after {usageLimit} unique {usageLimit === 1 ? 'visitor' : 'visitors'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time (Optional)
                  <span className="text-gray-500 font-normal ml-2">
                    IST - Campaign becomes active
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduleStart || ''}
                  onChange={(e) => setScheduleStart(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {scheduleStart && (
                  <p className="text-sm text-gray-600 mt-1">
                    Campaign will start at {scheduleStart.replace('T', ' at ')} IST
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time (Optional)
                  <span className="text-gray-500 font-normal ml-2">
                    IST - Campaign becomes inactive
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduleEnd || ''}
                  onChange={(e) => setScheduleEnd(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {scheduleEnd && (
                  <p className="text-sm text-gray-600 mt-1">
                    Campaign will end at {scheduleEnd.replace('T', ' at ')} IST
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-lock text-violet-600"></i>
                  Password Protection
                  <span className="text-gray-500 font-normal">
                    (Optional)
                  </span>
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (password) {
                        setPassword(null);
                      } else {
                        setPassword(generatePassword());
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      password
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    }`}
                  >
                    <i className={`fas ${password ? 'fa-lock-open' : 'fa-lock'} mr-2`}></i>
                    {password ? 'Remove Password' : 'Enable Password'}
                  </button>
                  {password && (
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword())}
                      className="px-4 py-2 bg-gray-50 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      Generate New
                    </button>
                  )}
                </div>
                {password && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Campaign Password:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(password);
                          alert('Password copied to clipboard!');
                        }}
                        className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy
                      </button>
                    </div>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono text-lg"
                      placeholder="Enter custom password"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Visitors will need this password to access the campaign
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setHasUnsavedChanges(true);
                }}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog Modal */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Not Named</h3>
                <p className="text-sm text-gray-600">Give your campaign a unique name</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                You haven't named your campaign yet. Please enter a name below:
              </p>
              <input
                type="text"
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                placeholder="Enter campaign name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Validate before saving
                    const trimmed = suggestedName.trim();
                    if (!trimmed) {
                      alert('Campaign name cannot be empty.');
                      return;
                    }
                    setCampaignName(trimmed);
                    setShowRenameDialog(false);
                    setTimeout(() => saveCampaign(), 100);
                  } else if (e.key === 'Escape') {
                    setShowRenameDialog(false);
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                Press Enter to save, Escape to cancel
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Validate before saving
                  const trimmed = suggestedName.trim();
                  if (!trimmed) {
                    alert('Campaign name cannot be empty.');
                    return;
                  }
                  setCampaignName(trimmed);
                  setShowRenameDialog(false);
                  // Trigger save after setting the name
                  setTimeout(() => saveCampaign(), 100);
                }}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
              >
                <i className="fas fa-save mr-2"></i>
                Save
              </button>
              <button
                onClick={() => setShowRenameDialog(false)}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
