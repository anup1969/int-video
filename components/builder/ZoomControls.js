export default function ZoomControls({ onZoomIn, onZoomOut, onZoomReset }) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomIn} className="zoom-btn" title="Zoom In">
        <i className="fas fa-plus"></i>
      </button>
      <button onClick={onZoomReset} className="zoom-btn" title="Reset Zoom">
        <i className="fas fa-expand"></i>
      </button>
      <button onClick={onZoomOut} className="zoom-btn" title="Zoom Out">
        <i className="fas fa-minus"></i>
      </button>
    </div>
  );
}
