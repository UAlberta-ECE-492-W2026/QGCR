export function ControlPage() {
  return (
    <div className="page">
      <h2>Robot Control</h2>
      <p className="page-description">
        Basic movement controls for QGCR as described in UC-002 (Control Robot). Buttons are currently
        UI-only and do not send commands.
      </p>
      <div className="card control-grid">
        <button className="btn primary">Forward</button>
        <div className="control-row">
          <button className="btn secondary">Turn Left</button>
          <button className="btn secondary">Turn Right</button>
        </div>
        <button className="btn danger">Stop</button>
      </div>
    </div>
  );
}

