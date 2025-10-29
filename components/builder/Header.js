export default function Header({ campaignName, scale, onSave, saveStatus, hasUnsavedChanges }) {
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <i className="fas fa-spinner fa-spin"></i> Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <i className="fas fa-check-circle"></i> Saved
          </span>
        );
      case 'error':
        return (
          <span className="text-sm text-red-600 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i> Save failed
          </span>
        );
      default:
        if (hasUnsavedChanges) {
          return (
            <span className="text-sm text-orange-600 flex items-center gap-1">
              <i className="fas fa-circle text-xs"></i> Unsaved changes
            </span>
          );
        }
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded transition">
          <i className="fas fa-arrow-left text-gray-600"></i>
        </button>
        <input
          type="text"
          defaultValue={campaignName || "Untitled Campaign"}
          className="text-lg font-semibold border-none outline-none bg-transparent"
        />
        {getSaveStatusDisplay()}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600 mr-2">
          Zoom: {Math.round(scale * 100)}%
        </div>
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-save mr-2"></i>
          {saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
        <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition">
          <i className="fas fa-cog mr-1"></i> Settings
        </button>
        <button className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition">
          <i className="fas fa-share mr-2"></i> Share
        </button>
      </div>
    </div>
  );
}
