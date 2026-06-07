import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Plus, MessageCircle, Bug,
  Clock, Activity, AlertCircle, CheckCircle2,
  Eye, MoreVertical, Paperclip, Calendar,
  Edit2, Trash2, Download, Upload, X, RefreshCw,
  ChevronLeft, ChevronRight, Image as ImageIcon, Film,
  FileSpreadsheet, FileText, File, Settings2
} from 'lucide-react';
import './ProductionIssues.css';
import { ProjectContext } from '../context/ProjectContext';



const STATUS_CONFIG = {
  'Open': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'In Progress': { color: '#f8ab37', bg: 'rgba(248,171,55,0.12)' },
  'Pending': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'Future Implementation': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  'Closed': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

const ProductionIssues = () => {
  const navigate = useNavigate();
  const { activeProject } = React.useContext(ProjectContext);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyId, setHistoryId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [waConfig, setWaConfig] = useState(null);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waChats, setWaChats] = useState([]);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState([]);
  const [colWidths, setColWidths] = useState({ pageName: 160, issue: 260 });
  const [usersList, setUsersList] = useState([]);
  const [avatarsDict, setAvatarsDict] = useState({});
  const [assigneeDropdown, setAssigneeDropdown] = useState(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [headers, setHeaders] = useState({
    sno: 'S.No',
    pageName: 'Page Name',
    issue: 'Issue',
    status: 'Status',
    assignee: 'Assigned To',
    deployDate: 'Deploy Date',
    raised: 'Issue Raised'
  });
  const fileInputRef = useRef(null);

  // ── Fetch Data ──────────────────────────────────────────────────
  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchWaConfig();
    
    // Automatic Background Sync every 10 seconds
    const intervalId = setInterval(() => {
      fetchIssues(false, true); // Pass a flag to indicate it's a background sync
    }, 10000);
    const waInterval = setInterval(fetchWaConfig, 10000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(waInterval);
    };
  }, []);

  const fetchWaConfig = async () => {
    try {
      const res = await fetch('/api/v1/whatsapp/status');
      const data = await res.json();
      setWaConfig(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaChats = async () => {
    try {
      const res = await fetch('/api/v1/whatsapp/chats');
      const data = await res.json();
      setWaChats(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
      setWaChats([]);
    }
  };

  const saveWaGroup = async () => {
    if (!selectedGroupToSave) return;
    try {
      await fetch('/api/v1/whatsapp/issue-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroupToSave })
      });
      setIsChangingGroup(false);
      fetchWaConfig();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        const names = data.data.map(u => u.name);
        setUsersList(names);
        const avatarMap = {};
        data.data.forEach(u => { avatarMap[u.name] = u.avatar; });
        setAvatarsDict(avatarMap);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchIssues = async (isSync = false, isBackground = false) => {
    if (isSync) setSyncing(true);
    try {
      const res = await fetch('/api/v1/issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      if (!isBackground) setLoading(false);
      if (isSync) setTimeout(() => setSyncing(false), 500); // Visual feedback
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────
  const updateIssue = async (id, field, value) => {
    const issueToUpdate = issues.find(i => i.id === id);
    if (!issueToUpdate) return;
    
    // Auto-move feature for "Future Implementation"
    if (field === 'status' && value === 'Future Implementation') {
      if (window.confirm('Move this issue to Requirements? This will remove it from Production Issues and create a new Requirement.')) {
        const payload = {
          title: issueToUpdate.pageName ? `${issueToUpdate.pageName} - ${issueToUpdate.issue}` : issueToUpdate.issue,
          module: issueToUpdate.pageName || 'General',
          description: `Imported from Production Issues.\n\nOriginal issue: ${issueToUpdate.issue}`,
          priority: 'Medium',
          status: 'Open',
          requestedBy: 'System',
          requestedDate: new Date().toLocaleString('en-GB'),
          targetDate: '-',
          source: 'Production Issues',
          notes: `Migrated from Production Issues (ID: ${issueToUpdate.id})`
        };
        try {
          await fetch('http://localhost:5000/api/v1/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          setIssues(prev => prev.filter(i => i.id !== id));
          await fetch(`/api/v1/issues/${id}`, { method: 'DELETE' });
          return;
        } catch (err) {
          console.error('Failed to move to requirements', err);
          alert('Failed to move item to requirements');
        }
      }
    }

    // Optimistic update
    const entry = { field, oldValue: issueToUpdate[field] || '', newValue: value || '', timestamp: new Date().toISOString(), who: (JSON.parse(localStorage.getItem('user'))?.name || 'System') };
    setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, [field]: value, history: [...(iss.history || []), entry] } : iss));

    try {
      await fetch(`/api/v1/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, historyEntry: entry })
      });
    } catch (err) {
      console.error('Failed to update issue', err);
    }
  };

  const deleteIssue = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    setIssues(prev => prev.filter(i => i.id !== id));
    setActiveMenu(null);
    try {
      await fetch(`/api/v1/issues/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete issue', err);
    }
  };

  const addRow = async () => {
    const newIssue = { pageName: '', issue: '', status: 'Open', assignee: '', deployDate: '-', deployVer: '', raisedSrc: '', attachments: [] };
    try {
      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => [data.data, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create issue', err);
    }
  };

  const handleAddColumn = () => {
    const colName = window.prompt("Enter new column name:");
    if (colName) {
      setCustomColumns([...customColumns, colName]);
      setHeaders(prev => ({...prev, [colName]: colName}));
    }
  };


  const handleAddUser = (name, issueId) => {
    if (!name || usersList.includes(name)) return;
    setUsersList(prev => [...prev, name]);
    updateIssue(issueId, 'assignee', name);
    setAssigneeDropdown(null);
    setAssigneeSearch('');
  };

  const openDatePicker = (e, selector) => {
    const input = e.currentTarget.querySelector(selector);
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const getAttachmentSrc = (attachment) => {
    if (attachment?.url) return `http://localhost:5000${attachment.url}`;
    return attachment?.previewUrl || attachment?.src || attachment?.dataUrl || '';
  };

  // ── Metrics ──────────────────────────────────────────────────────
  const total = issues.length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProg = issues.filter(i => i.status === 'In Progress').length;
  const pending = issues.filter(i => i.status === 'Pending').length;
  const closed = issues.filter(i => i.status === 'Closed').length;

  // ── Filter + Paginate ─────────────────────────────────────────────
  const filtered = issues.filter(i => {
    if (activeProject !== 'All' && i.project !== activeProject) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return (i.pageName + i.issue + i.assignee).toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

  // ── Export CSV ───────────────────────────────────────────────────
  const handleExportCSV = () => {
    let csv = 'Issue ID,Page Name,Issue,Status,Assignee,Deployment Date,Raised Date\n';
    issues.forEach((iss, i) => {
      csv += `PI-2025-000${String(56 - i).padStart(2, '0')},"${iss.pageName}","${iss.issue}","${iss.status}","${iss.assignee}","${iss.deployDate}","${iss.raisedDate}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ProductionIssues_${Date.now()}.csv`; a.click();
    setExportOpen(false);
  };

  const handleExportDoc = () => {
    let html = '<html><head><meta charset="utf-8"></head><body><h2>Production Issues</h2><table border="1" cellpadding="6"><tr><th>Issue ID</th><th>Page</th><th>Issue</th><th>Status</th><th>Assignee</th><th>Deploy Date</th></tr>';
    issues.forEach((iss, i) => {
      html += `<tr><td>PI-2025-000${String(56 - i).padStart(2, '0')}</td><td>${iss.pageName}</td><td>${iss.issue}</td><td>${iss.status}</td><td>${iss.assignee}</td><td>${iss.deployDate}</td></tr>`;
    });
    html += '</table></body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ProductionIssues_${Date.now()}.doc`; a.click();
    setExportOpen(false);
  };

  // ── History modal helper ─────────────────────────────────────────
  const historyIssue = issues.find(i => i.id === historyId);

  return (
    <div className="pi-page" onClick={() => { setActiveMenu(null); setExportOpen(false); setAssigneeDropdown(null); setIsAddMenuOpen(false); }}>

      {/* ── History Modal ── */}
      {historyId && historyIssue && (
        <div className="pi-modal-overlay" onClick={() => setHistoryId(null)}>
          <div className="pi-modal" onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header">
              <h3>Action History — {historyIssue.pageName}</h3>
              <button className="pi-modal-close" onClick={() => setHistoryId(null)}><X size={18} /></button>
            </div>
            <div className="pi-modal-body">
              {historyIssue.history.length === 0
                ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No history recorded yet.</p>
                : historyIssue.history.slice().reverse().map((h, i) => (
                  <div key={i} className="pi-history-item">
                    <div className="pi-history-dot"><Clock size={12} /></div>
                    <div className="pi-history-detail">
                      <span className="pi-history-who">{h.who}</span>
                      <span className="pi-history-action">
                        Changed <strong>{h.field}</strong> from <code>{h.oldValue || 'empty'}</code> → <code>{h.newValue || 'empty'}</code>
                      </span>
                      <span className="pi-history-time">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="pi-header">
        <div>
          <h2>Production Issues</h2>
          <p>Issues raised by clients are automatically captured and tracked here.</p>
        </div>
        <div className="header-actions" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '4px 12px', borderRadius: '20px', 
            background: waConfig?.status === 'Connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: waConfig?.status === 'Connected' ? '#22c55e' : '#ef4444',
            fontSize: '13px', fontWeight: '500'
          }}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: waConfig?.status === 'Connected' ? '#22c55e' : '#ef4444'}}></div>
            {waConfig?.status === 'Connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
          </div>
          <button className="sync-btn" onClick={() => { setShowWaSettings(true); fetchWaChats(); }} style={{background: 'rgba(255,255,255,0.05)', color: '#141414ff'}}>
            <Settings2 size={16} /> WhatsApp Settings
          </button>
          <button className="sync-btn" onClick={() => fetchIssues(true)} disabled={syncing}>
            <MessageCircle size={16} className={syncing ? "animate-spin" : ""} /> 
            {syncing ? 'Syncing...' : 'Sync WhatsApp'}
          </button>
          <button className="create-issue-btn" onClick={() => navigate('/issues/create')}><Plus size={16} /> Create Issue</button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="pi-metrics">
        {[
          { label: 'Total Issues', val: total, sub: 'All Time', icon: <Bug size={22} />, iconBg: 'rgba(248,171,55,0.12)', iconColor: '#f8ab37' },
          { label: 'Open', val: openCount, sub: `${total ? ((openCount / total) * 100).toFixed(1) : 0}%`, icon: <Activity size={22} />, iconBg: 'rgba(239,68,68,0.12)', iconColor: '#ef4444' },
          { label: 'In Progress', val: inProg, sub: `${total ? ((inProg / total) * 100).toFixed(1) : 0}%`, icon: <Clock size={22} />, iconBg: 'rgba(248,171,55,0.12)', iconColor: '#f8ab37' },
          { label: 'Pending', val: pending, sub: `${total ? ((pending / total) * 100).toFixed(1) : 0}%`, icon: <AlertCircle size={22} />, iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a855f7' },
          { label: 'Closed', val: closed, sub: `${total ? ((closed / total) * 100).toFixed(1) : 0}%`, icon: <CheckCircle2 size={22} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e' },
        ].map(m => (
          <div key={m.label} className="metric-card" 
               style={{ border: filterStatus === m.label || (m.label === 'Total Issues' && !filterStatus) ? `1px solid ${m.iconColor}` : undefined, cursor: 'pointer' }}
               onClick={() => setFilterStatus(m.label === 'Total Issues' ? null : m.label)}>
            <div className="metric-icon" style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
            <div className="metric-info">
              <h4>{m.label}</h4>
              <h2>{m.val}</h2>
              <span>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="pi-toolbar-row" onClick={e => e.stopPropagation()}>
        <div className="filter-search" style={{ maxWidth: 260 }}>
          <Search size={15} className="search-icon" />
          <input type="text" placeholder="Search issues..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <div style={{ flex: 1 }} />

        {/* Upload CSV */}
        <button className="pi-tool-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} /> Upload CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} />

        {/* Export */}
        <div style={{ position: 'relative' }}>
          <button className="pi-tool-btn" onClick={e => { e.stopPropagation(); setExportOpen(o => !o); }}>
            <Download size={15} /> Export <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <div className="pi-dropdown-menu">
              <button onClick={handleExportCSV} style={{ color: '#22c55e' }}><FileSpreadsheet size={14} style={{ marginRight: 6 }}/> Download CSV</button>
              <button onClick={handleExportDoc} style={{ color: '#38bdf8' }}><FileText size={14} style={{ marginRight: 6 }}/> Download Doc</button>
              <button onClick={() => { window.print(); setExportOpen(false); }} style={{ color: '#ef4444' }}><File size={14} style={{ marginRight: 6 }}/> Download PDF</button>
            </div>
          )}
        </div>

        {/* Add row/col */}
        <div style={{ position: 'relative' }}>
          <button className="create-issue-btn" style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            onClick={(e) => { e.stopPropagation(); setIsAddMenuOpen(!isAddMenuOpen); }}>
            <Plus size={14} /> Add Action <ChevronDown size={13} style={{ marginLeft: 2 }} />
          </button>
          {isAddMenuOpen && (
            <div className="pi-dropdown-menu" style={{ right: 0, minWidth: 120 }}>
              <button onClick={() => { addRow(); setIsAddMenuOpen(false); }}>Add Row</button>
              <button onClick={() => { handleAddColumn(); setIsAddMenuOpen(false); }}>Add Column</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="pi-table-container">
        <table className="pi-table pi-table-editable">
          <thead>
            <tr>
              <th style={{ width: 50 }}>
                <input className="pi-header-input" value={headers.sno} onChange={e => setHeaders(p => ({ ...p, sno: e.target.value }))} />
              </th>
              <th style={{ width: colWidths.pageName, minWidth: colWidths.pageName }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" value={headers.pageName} onChange={e => setHeaders(p => ({ ...p, pageName: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, pageName: Math.max(80, p.pageName - 40) }))} title="Decrease width"><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, pageName: p.pageName + 40 }))} title="Increase width"><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ width: colWidths.issue, minWidth: colWidths.issue }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" value={headers.issue} onChange={e => setHeaders(p => ({ ...p, issue: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, issue: Math.max(120, p.issue - 40) }))} title="Decrease width"><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, issue: p.issue + 40 }))} title="Increase width"><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th>
                <input className="pi-header-input" value={headers.status} onChange={e => setHeaders(p => ({ ...p, status: e.target.value }))} />
              </th>
              <th>
                <input className="pi-header-input" value={headers.assignee} onChange={e => setHeaders(p => ({ ...p, assignee: e.target.value }))} />
              </th>
              <th>
                <input className="pi-header-input" value={headers.deployDate} onChange={e => setHeaders(p => ({ ...p, deployDate: e.target.value }))} />
              </th>
              <th>
                <input className="pi-header-input" value={headers.raised} onChange={e => setHeaders(p => ({ ...p, raised: e.target.value }))} />
              </th>
              {customColumns.map(col => (
                <th key={col}>
                  <input className="pi-header-input" value={headers[col] || col} onChange={e => setHeaders(p => ({ ...p, [col]: e.target.value }))} />
                </th>
              ))}
              <th style={{ width: 80, textAlign: 'center' }}><Paperclip size={14} /></th>
              <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((iss, idx) => {
              const sc = STATUS_CONFIG[iss.status] || { color: '#a0a3b1', bg: 'rgba(160,163,177,0.1)' };
              const avatar = avatarsDict[iss.assignee];
              return (
                <tr key={iss.id}>
                  {/* S.No */}
                  <td className="text-center" style={{ color: '#6b7280', fontWeight: 500 }}>{startIdx + idx + 1}</td>

                  {/* Page Name — inline editable */}
                  <td style={{ width: colWidths.pageName, minWidth: colWidths.pageName }}>
                    <input
                      className="pi-inline-input pi-no-underline"
                      value={iss.pageName}
                      onChange={e => updateIssue(iss.id, 'pageName', e.target.value)}
                      placeholder="Page name..."
                    />
                  </td>

                  {/* Issue — inline textarea */}
                  <td style={{ width: colWidths.issue, minWidth: colWidths.issue }}>
                    <textarea
                      className="pi-inline-textarea pi-no-underline"
                      value={iss.issue}
                      onChange={e => updateIssue(iss.id, 'issue', e.target.value)}
                      placeholder="Describe issue..."
                    />
                  </td>

                  {/* Status — colored dropdown with chevron */}
                  <td>
                    <div className="pi-status-wrapper" style={{ background: sc.bg, borderColor: sc.color + '55', boxShadow: `0 0 6px ${sc.color}22` }}>
                      <select
                        className="pi-status-select"
                        value={iss.status}
                        style={{ color: sc.color }}
                        onChange={e => updateIssue(iss.id, 'status', e.target.value)}
                      >
                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ color: sc.color, flexShrink: 0, pointerEvents: 'none', marginRight: 4 }} />
                    </div>
                  </td>

                  {/* Assignee — avatar + searchable dropdown */}
                  <td>
                    <div className="pi-assignee-cell" style={{ position: 'relative' }}>
                      {avatar
                        ? <img src={avatar} alt={iss.assignee} className="pi-inline-avatar" />
                        : <div className="pi-inline-avatar-ph"><Search size={11} /></div>
                      }
                      <div 
                        className="pi-inline-select pi-no-underline" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onClick={(e) => { e.stopPropagation(); setAssigneeDropdown(assigneeDropdown === iss.id ? null : iss.id); setAssigneeSearch(''); }}
                      >
                        <span style={{ color: iss.assignee ? '#f3f0f0ff' : '#6b7280' }}>
                          {iss.assignee || 'Select...'}
                        </span>
                        <ChevronDown size={12} style={{ color: '#6b7280' }} />
                      </div>

                      {assigneeDropdown === iss.id && (
                        <div className="pi-assignee-menu" onClick={e => e.stopPropagation()}>
                          <div className="pi-assignee-search">
                            <Search size={12} color="#a0a3b1" />
                            <input 
                              autoFocus
                              placeholder="Search or add user..." 
                              value={assigneeSearch}
                              onChange={e => setAssigneeSearch(e.target.value)}
                            />
                          </div>
                          <div className="pi-assignee-list">
                            <div className="pi-assignee-opt" onClick={() => { updateIssue(iss.id, 'assignee', ''); setAssigneeDropdown(null); }}>
                              Clear assignee
                            </div>
                            {usersList.filter(u => u.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => (
                              <div key={u} className="pi-assignee-opt" onClick={() => { updateIssue(iss.id, 'assignee', u); setAssigneeDropdown(null); }}>
                                {avatarsDict[u] ? <img src={avatarsDict[u]} alt="" className="pi-inline-avatar" style={{width: 20, height: 20}} /> : <div className="pi-inline-avatar-ph" style={{width: 20, height: 20}}><Search size={9}/></div>}
                                {u}
                              </div>
                            ))}
                            {assigneeSearch && !usersList.some(u => u.toLowerCase() === assigneeSearch.toLowerCase()) && (
                              <div className="pi-assignee-add-opt" onClick={() => handleAddUser(assigneeSearch, iss.id)}>
                                <Plus size={12} /> Add "{assigneeSearch}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Deploy Date — date picker with calendar icon */}
                  <td>
                    <div
                      className="pi-date-cell"
                      style={{ position: 'relative' }}
                      onClick={(e) => openDatePicker(e, 'input[type="date"]')}
                    >
                      <Calendar size={13} className="pi-date-cal-icon" />
                      <div className="pi-date-display">{iss.deployDate && iss.deployDate !== '-' ? iss.deployDate : 'Pick date'}</div>
                      <input
                        type="date"
                        className="pi-inline-date"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker();
                        }}
                        onChange={e => updateIssue(iss.id, 'deployDate', e.target.value
                          ? new Date(e.target.value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
                          : '-'
                        )}
                        style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </td>

                  {/* Issue Raised — with calendar picker */}
                  <td>
                    <div
                      className="pi-date-cell"
                      style={{ position: 'relative' }}
                      onClick={(e) => openDatePicker(e, 'input[type="datetime-local"]')}
                    >
                      <Calendar size={13} className="pi-date-cal-icon" />
                      <div className="pi-date-display" style={{ color: '#d1d5db' }}>{iss.raisedDate}</div>
                      <input
                        type="datetime-local"
                        className="pi-inline-date"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker();
                        }}
                        onChange={e => {
                          if (!e.target.value) return;
                          const d = new Date(e.target.value);
                          const formatted = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
                            + ', ' + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
                          updateIssue(iss.id, 'raisedDate', formatted);
                        }}
                        style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                      <div className="raised-source">{iss.raisedSrc}</div>
                    </div>
                  </td>

                  {/* Custom Columns */}
                  {customColumns.map(col => (
                    <td key={col}>
                      <input
                        className="pi-inline-input pi-no-underline"
                        value={iss[col] || ''}
                        onChange={e => updateIssue(iss.id, col, e.target.value)}
                        placeholder={`Enter ${col}...`}
                      />
                    </td>
                  ))}

                  {/* Attachments */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="attachments-cell" style={{ justifyContent: 'center', gap: '6px' }}>
                      {Array.isArray(iss.attachments) && iss.attachments.length > 0 ? (
                        iss.attachments.map((a, i) => {
                          const src = getAttachmentSrc(a);
                          return (
                          <span key={i} className="pi-attachment-wrap" title={a.name}>
                            {a.type === 'image' ? <ImageIcon size={14} /> : a.type === 'video' ? <Film size={14} /> : <Paperclip size={14} />}
                            {(a.type === 'image' || a.type === 'video') && (
                              <div className="pi-attachment-preview" role="tooltip">
                                {src ? (
                                  a.type === 'image'
                                    ? <img src={src} alt={a.name || 'Attachment preview'} />
                                    : (
                                      <video
                                        src={src}
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.pause();
                                          e.currentTarget.currentTime = 0;
                                        }}
                                      />
                                    )
                                ) : (
                                  <div className="pi-attachment-empty">
                                    Preview not available
                                    <span>{a.name}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </span>
                          );
                        })
                      ) : (
                        <span style={{ color: '#4b5563' }}><Paperclip size={13} /> 0</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="pi-row-actions">
                      {/* History */}
                      <button className="pi-row-btn" title="View History" onClick={() => setHistoryId(iss.id)}>
                        <Clock size={15} />
                      </button>
                      {/* View */}
                      <button className="pi-row-btn" title="View Details" onClick={() => navigate(`/issues/${iss.id}`)}>
                        <Eye size={15} />
                      </button>
                      {/* More menu */}
                      <div style={{ position: 'relative' }}>
                        <button className="pi-row-btn" title="More" onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === iss.id ? null : iss.id); }}>
                          <MoreVertical size={15} />
                        </button>
                        {activeMenu === iss.id && (
                          <div className="pi-dropdown-menu pi-row-menu" onClick={e => e.stopPropagation()}>
                            <button onClick={() => navigate('/issues/create')}><Edit2 size={13} /> Edit</button>
                            <button className="text-red" onClick={() => deleteIssue(iss.id)}><Trash2 size={13} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No issues found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ── */}
      <div className="pi-footer">
        <div className="footer-left">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select className="rows-select" value={rowsPerPage} onChange={e => { setRowsPerPage(+e.target.value); setCurrentPage(1); }}>
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span>Showing {filtered.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + rowsPerPage, filtered.length)} of {filtered.length} entries</span>
        </div>
        <div className="pagination">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${currentPage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>
      {showWaSettings && waConfig && (
        <div className="pi-modal-overlay" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>
          <div className="pi-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header">
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '20px'}}/> 
                Production Issues WhatsApp Config
              </h3>
              <button className="pi-modal-close" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}><X size={18} /></button>
            </div>
            
            <div className="pi-modal-body">
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                  <span style={{color: 'inherit', fontWeight: 500}}>Connection Status</span>
                  <span style={{color: waConfig.status === 'Connected' ? '#22c55e' : '#ef4444', fontWeight: 600}}>{waConfig.status}</span>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                  <span style={{color: 'inherit', fontWeight: 500}}>Connected Device</span>
                  <span style={{color: 'inherit', fontWeight: 500}}>{waConfig.connectedDeviceId || 'None'}</span>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                  <span style={{color: 'inherit', fontWeight: 500}}>Selected Issue Group</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {!isChangingGroup ? (
                      <>
                        <span style={{color: 'inherit', fontWeight: 500}}>
                          {waConfig.issueDefaultGroup ? waChats.find(c => c.id === waConfig.issueDefaultGroup)?.name || waConfig.issueDefaultGroup : 'Not Configured'}
                        </span>
                        {waConfig.status === 'Connected' && (
                          <button style={{background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={() => { setIsChangingGroup(true); fetchWaChats(); }}>Change</button>
                        )}
                      </>
                    ) : (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <select className="pi-status-select" style={{background: 'var(--bg-secondary, #fff)', color: 'inherit', border: '1px solid var(--border-color, #d1d5db)', width: '150px'}} value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)}>
                          <option value="">Select Group...</option>
                          {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button style={{background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={saveWaGroup}>Save</button>
                        <button style={{background: 'transparent', color: 'inherit', border: '1px solid var(--border-color, #d1d5db)', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={() => setIsChangingGroup(false)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>

                {!isChangingGroup && (
                  <div style={{marginTop: '8px', display: 'flex', gap: '12px'}}>
                    {waConfig.status === 'Connected' ? (
                      <>
                        <button className="sync-btn" style={{flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none'}} onClick={() => { setShowWaSettings(false); navigate('/whatsapp'); }}>Disconnect WhatsApp</button>
                      </>
                    ) : (
                      <button className="sync-btn" style={{flex: 1, justifyContent: 'center', background: '#3b82f6', color: '#fff', border: 'none'}} onClick={() => { setShowWaSettings(false); navigate('/whatsapp'); }}>Reconnect WhatsApp</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionIssues;
