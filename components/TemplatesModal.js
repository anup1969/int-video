import { useState, useEffect } from 'react';

const CATEGORY_INFO = {
  'lead-generation': {
    name: 'Lead Generation',
    icon: 'fa-user-plus',
    color: 'violet'
  },
  'product-feedback': {
    name: 'Product Feedback',
    icon: 'fa-comment-dots',
    color: 'blue'
  },
  'customer-survey': {
    name: 'Customer Survey',
    icon: 'fa-poll',
    color: 'green'
  },
  'faq': {
    name: 'FAQ',
    icon: 'fa-question-circle',
    color: 'yellow'
  },
  'support': {
    name: 'Support',
    icon: 'fa-headset',
    color: 'red'
  },
  'training': {
    name: 'Training',
    icon: 'fa-graduation-cap',
    color: 'purple'
  }
};

export default function TemplatesModal({ isOpen, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <i className="fas fa-layer-group"></i>
                Choose a Template
              </h2>
              <p className="text-purple-100 mt-1">
                Start with a pre-built template and customize it to your needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-white text-purple-600'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              <i className="fas fa-th mr-2"></i>
              All Templates
            </button>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === key
                    ? 'bg-white text-purple-600'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                <i className={`fas ${info.icon} mr-2`}></i>
                {info.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">No templates found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const categoryInfo = CATEGORY_INFO[template.category];
                const stepCount = template.steps?.length || 0;

                return (
                  <div
                    key={template.id}
                    className={`bg-white border-2 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer ${
                      selectedTemplate?.id === template.id
                        ? 'border-purple-600 shadow-lg'
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {/* Template Header */}
                    <div className={`bg-${categoryInfo?.color || 'gray'}-100 p-6 text-center`}>
                      <div className={`w-16 h-16 bg-${categoryInfo?.color || 'gray'}-600 rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <i className={`fas ${categoryInfo?.icon || 'fa-file'} text-white text-2xl`}></i>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{template.name}</h3>
                    </div>

                    {/* Template Body */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {template.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>
                          <i className="fas fa-list-ol mr-1"></i>
                          {stepCount} steps
                        </span>
                        {template.is_system && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <i className="fas fa-star mr-1"></i>
                            System
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-check-circle"></i>
                        Use This Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-1"></i>
              Templates can be customized after selection
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
