import { answerTypes } from '../../lib/utils/constants';

export default function Sidebar({ onAddStep, onPreview, onSidebarDragStart }) {
  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Campaign Builder v4</h1>
        <p className="text-sm text-gray-500">Enhanced with QC fixes</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Answer Types</div>
        {answerTypes.map((type) => (
          <div
            key={type.id}
            draggable
            onDragStart={(e) => onSidebarDragStart(e, type.id)}
            className="sidebar-item p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-violet-300"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{type.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800">{type.label}</div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onAddStep}
          className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition"
        >
          <i className="fas fa-plus mr-2"></i> Add New Step
        </button>
        <button
          onClick={onPreview}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          <i className="fas fa-eye mr-2"></i> Preview Campaign
        </button>
      </div>
    </div>
  );
}
