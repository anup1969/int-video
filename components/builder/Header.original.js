export default function Header({ campaignName, scale }) {
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
        <span className="text-sm text-green-600">
          <i className="fas fa-check-circle mr-1"></i>Auto-saved
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600 mr-2">
          Zoom: {Math.round(scale * 100)}%
        </div>
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
