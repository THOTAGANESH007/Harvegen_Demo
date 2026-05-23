'use client'

export default function FileTree({
  files,
  activeFileId,
  onSelect,
  collapsed,
  onToggleCollapse,
  libraries = [],
  onAddLibraryClick
}) {
  const getIcon = (type) => {
    switch (type) {
      case 'c': return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#82aaff" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
      case 'json': return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f78c6c" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
      default: return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#546e7a" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    }
  }

  return (
    <div className={`sim-filetree ${collapsed ? 'collapsed' : ''}`}>
      <div className="sim-filetree-header" onClick={onToggleCollapse} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>PROJECT</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {!collapsed && (
        <>
          <div className="sim-filetree-group">
            <div className="sim-filetree-folder">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#7986cb" stroke="#7986cb" strokeWidth="0">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>src</span>
            </div>
            {files.map(file => (
              <button
                key={file.id}
                className={`sim-filetree-file ${file.id === activeFileId ? 'active' : ''}`}
                onClick={() => onSelect(file.id)}
              >
                {getIcon(file.type)}
                <span>{file.name}</span>
                {file.id === activeFileId && <div className="sim-file-active-bar" />}
              </button>
            ))}
          </div>

          <div className="sim-filetree-section">
            <div className="sim-filetree-header">BOARD</div>
            <div className="sim-board-info">
              <div className="sim-board-icon">STM</div>
              <div>
                <div className="sim-board-name">STM32F103C8T6</div>
                <div className="sim-board-sub">· ARM Cortex-M3</div>
              </div>
            </div>
          </div>

          <div className="sim-filetree-section">
            <div className="sim-filetree-header">LIBRARIES</div>
            {libraries.map(lib => (
              <div key={lib} className="sim-library-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#69f0ae" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {lib}
              </div>
            ))}
            <button className="sim-add-lib-btn" onClick={onAddLibraryClick}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Library
            </button>
          </div>
        </>
      )}
    </div>
  )
}
