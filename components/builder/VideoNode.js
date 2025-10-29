import { useState, useRef, useEffect } from 'react';
import { answerTypes } from '../../lib/utils/constants';

export default function VideoNode({ node, onEdit, onDelete, onDuplicate, onDragStart, onRename, selected }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(node.label);
  const titleRef = useRef(null);

  const isIncomplete = node.logicRules?.some(rule => !rule.target || rule.target === '');

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleClick = (e) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onRename(node.id, tempTitle.trim());
    } else {
      setTempTitle(node.label);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(node.label);
    }
  };

  return (
    <div
      className={`node ${selected ? 'selected' : ''} ${isIncomplete ? 'incomplete' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      draggable
      onDragStart={(e) => onDragStart(e, node.id)}
    >
      <div className="connection-point source" data-node-id={node.id} data-type="source"></div>
      <div className="connection-point target" data-node-id={node.id} data-type="target"></div>

      <div className="node-thumbnail">
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Step {node.stepNumber}
        </div>
        {isIncomplete && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            ⚠️ Incomplete
          </div>
        )}
        <div className="text-white">
          {node.videoPlaceholder || '🎬'}
        </div>
        <div className="answer-badge">
          <span>{answerTypes.find(t => t.id === node.answerType)?.icon}</span>
          <span>{answerTypes.find(t => t.id === node.answerType)?.label}</span>
        </div>
      </div>

      <div className="node-content">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full font-semibold text-sm text-gray-800 px-2 py-1 border-2 border-violet-500 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="node-title-editable"
            onClick={handleTitleClick}
            title="Click to rename"
          >
            {node.label || 'Untitled Step'}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {node.logicRules?.length > 0 ? (
            isIncomplete ? (
              <span className="text-orange-600">⚠️ {node.logicRules.filter(r => !r.target).length} paths incomplete</span>
            ) : (
              `✅ ${node.logicRules.length} path${node.logicRules.length > 1 ? 's' : ''} set`
            )
          ) : 'No Logic'}
        </div>
      </div>

      <div className="node-actions">
        <button
          onClick={() => onEdit(node.id)}
          className="flex-1 px-3 py-1.5 bg-violet-50 text-violet-600 rounded text-xs font-medium hover:bg-violet-100 transition"
        >
          <i className="fas fa-edit"></i> Edit
        </button>
        <button
          onClick={() => onDuplicate(node.id)}
          className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100 transition"
        >
          <i className="fas fa-copy"></i>
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}
