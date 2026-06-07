import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Upload, Plus, RefreshCw, Trash2, Edit2, Calendar, Check, Search, ChevronLeft, ChevronRight, ChevronDown, LayoutList, MoreHorizontal, Cloud, Server, Clock, X } from 'lucide-react';
import { parseMomNotes } from '../utils/momParser';
import './MomTracker.css';

const MomTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [points, setPoints] = useState([]);
  const [statuses, setStatuses] = useState([
    { name: 'Completed', color: '#22c55e' },
    { name: 'In Progress', color: '#3b82f6' },
    { name: 'Pending', color: '#eab308' },
    { name: 'Open', color: '#f8ab37' }
  ]);
  const [users, setUsers] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [colWidths, setColWidths] = useState({ pageName: 200, issue: 300 });
  const [loading, setLoading] = useState(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [historyModalPointId, setHistoryModalPointId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const fileInputRef = useRef(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const newStatusColor = '#22c55e'; // Not used in edit but kept for structure
  const [statusDropdownTarget, setStatusDropdownTarget] = useState(null);
  const actionsRef = useRef(null);
  
  const PRESET_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f8ab37', '#ef4444', '#a855f7'];

  const [saveStatus, setSaveStatus] = useState('Last Updated');
  const [trackerSearch, setTrackerSearch] = useState('');
  
  // Filters
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let userStr = localStorage.getItem('user');
    let name = userStr ? JSON.parse(userStr).name : 'Unknown User';
    setCurrentUserName(name);
    fetchData();

    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);



  const fetchData = async () => {
    try {
      const momRes = await fetch('/api/v1/mom');
      const momData = await momRes.json();
      const currentMeeting = momData.data.find(m => m.id === parseInt(id));
      setMeeting(currentMeeting);

      const userRes = await fetch('/api/v1/users');
      const userData = await userRes.json();
      setUsers(userData.data);

      const settingsRes = await fetch('/api/v1/tracker/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.data) {
        if (settingsData.data.statuses && settingsData.data.statuses.length > 0) {
          const mappedStatuses = settingsData.data.statuses.map(s => {
            if (typeof s === 'string') {
              return { name: s, color: '#f8ab37' }; // default fallback color
            }
            return s;
          });
          setStatuses(mappedStatuses);
        }
        if (settingsData.data.columns && settingsData.data.columns.length > 0) {
          setCustomColumns(settingsData.data.columns);
        }
      }

      const pointsRes = await fetch(`/api/v1/tracker/${id}`);
      const pointsData = await pointsRes.json();
      
      if (!pointsData.data || pointsData.data.length === 0) {
        let initialPoints = [];
        if (currentMeeting && currentMeeting.notes) {
          const parsedPoints = parseMomNotes(currentMeeting.notes);
          initialPoints = parsedPoints.map((parsed, idx) => {
            return {
              id: Date.now() + idx,
              pageName: parsed.pageName,
              issue: parsed.issueText,
              status: 'Open',
              assignee: '',
              stagingDate: '',
              prodDate: ''
            };
          });
        }
        
        if (initialPoints.length === 0) {
          initialPoints = [{ id: Date.now()+1, pageName: '', issue: '', status: 'Open', assignee: '', stagingDate: '', prodDate: '' }];
        }
        setPoints(initialPoints);
        
        fetch(`/api/v1/tracker/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: initialPoints })
        }).catch(err => console.error(err));
      } else {
        setPoints(pointsData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePoints = async (newPoints) => {
    setSaveStatus('Saving...');
    try {
      await fetch(`/api/v1/tracker/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints })
      });
      setSaveStatus('All changes saved');
      setTimeout(() => setSaveStatus('Last Updated'), 3000);
    } catch (err) {
      console.error('Failed to save points', err);
      setSaveStatus('Save Failed');
    }
  };

  const updatePoint = (pointId, field, value) => {
    const updatedPoints = points.map(p => {
      if (p.id === pointId) {
        if (p[field] !== value) {
          const newHistoryItem = {
            field,
            oldValue: p[field] || '',
            newValue: value || '',
            timestamp: new Date().toISOString(),
            who: currentUserName || 'Unknown'
          };
          return { 
            ...p, 
            [field]: value, 
            history: [...(p.history || []), newHistoryItem] 
          };
        }
      }
      return p;
    });
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const handleStatusChange = async (point, newStatus) => {
    // Auto-move feature for "Future Implementation"
    if (newStatus === 'Future Implementation') {
      if (window.confirm(`Move this item to Requirements? This will remove it from the MOM Tracker and create a new Requirement.`)) {
        const payload = {
          title: point.pageName ? `${point.pageName} - ${point.issue}` : point.issue || 'Untitled Point',
          module: point.pageName || 'General',
          description: `Imported from MOM Tracker.\n\nOriginal issue: ${point.issue}`,
          priority: 'Medium',
          status: 'Open',
          requestedBy: currentUserName || 'System',
          requestedDate: new Date().toLocaleString('en-GB'),
          targetDate: '-',
          source: 'MOM Tracker',
          notes: `Migrated from MOM Tracker (Meeting ID: ${id})`
        };
        
        try {
          await fetch('/api/v1/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          // Remove from tracker immediately
          const updatedPoints = points.filter(p => p.id !== point.id);
          setPoints(updatedPoints);
          savePoints(updatedPoints);
          return;
        } catch(err) {
          console.error('Failed to move to requirements', err);
          alert('Failed to move item to requirements');
        }
      }
    }
    updatePoint(point.id, 'status', newStatus);
  };

  const addPoint = () => {
    const updatedPoints = [
      ...points, 
      { id: Date.now(), pageName: '', issue: '', status: 'Open', assignee: '', stagingDate: '', prodDate: '' }
    ];
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const removePoint = (pointId) => {
    if (!window.confirm("Delete this row?")) return;
    const updatedPoints = points.filter(p => p.id !== pointId);
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const handleAddStatusSubmit = async () => {
    if (!newStatusName.trim()) return;
    const statusObj = { name: newStatusName.trim(), color: newStatusColor };
    try {
      const res = await fetch('/api/v1/tracker/settings/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusObj })
      });
      const data = await res.json();
      if (data.success) {
        setStatuses(data.data);
        if (statusDropdownTarget) {
          updatePoint(statusDropdownTarget, 'status', statusObj.name);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsStatusModalOpen(false);
    setNewStatusName('');
    setStatusDropdownTarget(null);
  };

  const handleAddColumn = async () => {
    const colName = window.prompt("Enter new column name:");
    if (!colName || !colName.trim()) return;
    const cleanColName = colName.trim();
    if (customColumns.includes(cleanColName)) {
      alert("Column already exists");
      return;
    }
    
    const newColumns = [...customColumns, cleanColName];
    try {
      const res = await fetch('/api/v1/tracker/settings/columns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns })
      });
      const data = await res.json();
      if (data.success) {
        setCustomColumns(data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add column");
    }
    setIsAddMenuOpen(false);
  };

  const handleUploadExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const newPoints = [];
      let maxId = points.reduce((max, p) => p.id > max ? p.id : max, 0);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let inQuotes = false;
        let currentVal = '';
        const values = [];
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim());

        const point = {
          id: ++maxId,
          pageName: '',
          issue: '',
          status: 'Open',
          assignee: '',
          stagingDate: '',
          prodDate: '',
          history: [{
            field: 'status',
            oldValue: '',
            newValue: 'Imported',
            timestamp: new Date().toISOString(),
            who: currentUserName || 'Unknown'
          }]
        };

        headers.forEach((h, index) => {
          const val = values[index] || '';
          if (h === 'Page Name') point.pageName = val;
          else if (h === 'Issue / Point') point.issue = val;
          else if (h === 'Status') point.status = val;
          else if (h === 'Assignee') point.assignee = val;
          else if (h === 'Staging Deployment') point.stagingDate = val;
          else if (h === 'Production Deployment') point.prodDate = val;
          else if (customColumns.includes(h)) point[h] = val;
        });

        newPoints.push(point);
      }

      if (newPoints.length > 0) {
        const updated = [...points, ...newPoints];
        setPoints(updated);
        savePoints(updated);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportExcel = () => {
    let csv = 'S.No,Page Name,Issue / Point,Status,Assignee,Staging Deployment,Production Deployment';
    customColumns.forEach(col => csv += `,${col}`);
    csv += '\n';

    points.forEach((p, index) => {
      let row = [
        index + 1,
        `"${(p.pageName || '').replace(/"/g, '""')}"`,
        `"${(p.issue || '').replace(/"/g, '""')}"`,
        `"${(p.status || '').replace(/"/g, '""')}"`,
        `"${(p.assignee || '').replace(/"/g, '""')}"`,
        `"${(p.stagingDate || '').replace(/"/g, '""')}"`,
        `"${(p.prodDate || '').replace(/"/g, '""')}"`
      ];
      customColumns.forEach(col => {
        row.push(`"${(p[col] || '').replace(/"/g, '""')}"`);
      });
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tracker_Export_${Date.now()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportDoc = () => {
    let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    html += "<h2>Tracker Export</h2><table border='1' cellpadding='5' cellspacing='0'><thead><tr>";
    html += "<th>S.No</th><th>Page Name</th><th>Issue / Point</th><th>Status</th><th>Assignee</th><th>Staging Deployment</th><th>Production Deployment</th>";
    customColumns.forEach(col => html += `<th>${col}</th>`);
    html += "</tr></thead><tbody>";

    points.forEach((p, index) => {
      html += "<tr>";
      html += `<td>${index + 1}</td>`;
      html += `<td>${p.pageName || ''}</td>`;
      html += `<td>${p.issue || ''}</td>`;
      html += `<td>${p.status || ''}</td>`;
      html += `<td>${p.assignee || ''}</td>`;
      html += `<td>${p.stagingDate || ''}</td>`;
      html += `<td>${p.prodDate || ''}</td>`;
      customColumns.forEach(col => {
        html += `<td>${p[col] || ''}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table></body></html>";

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tracker_Export_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportPdf = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  // Filter Logic
  const filteredPoints = points.filter(p => {
    if (selectedAssignee && p.assignee !== selectedAssignee) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (selectedDeployment === 'Staging' && !p.stagingDate) return false;
    if (selectedDeployment === 'Production' && !p.prodDate) return false;
    
    if (trackerSearch) {
      return (p.pageName || '').toLowerCase().includes(trackerSearch.toLowerCase()) || 
             (p.issue || '').toLowerCase().includes(trackerSearch.toLowerCase());
    }
    return true;
  });

  // Summary Logic
  const totalPoints = points.length;
  const openCount = points.filter(p => p.status === 'Open').length;
  const inProgressCount = points.filter(p => p.status === 'In Progress').length;
  const pendingCount = points.filter(p => p.status === 'Pending').length;
  const completedCount = points.filter(p => p.status === 'Completed').length;
  const stagingCount = points.filter(p => p.stagingDate).length;
  const prodCount = points.filter(p => p.prodDate).length;

  const getPercent = (count) => totalPoints ? ((count / totalPoints) * 100).toFixed(2) : '0.00';

  let assigneeStats = { assigned: 0, open: 0, inProgress: 0, pending: 0, completed: 0 };
  let assigneeDetails = null;
  if (selectedAssignee) {
    const assignPoints = points.filter(p => p.assignee === selectedAssignee);
    assigneeStats.assigned = assignPoints.length;
    assigneeStats.open = assignPoints.filter(p => p.status === 'Open').length;
    assigneeStats.inProgress = assignPoints.filter(p => p.status === 'In Progress').length;
    assigneeStats.pending = assignPoints.filter(p => p.status === 'Pending').length;
    assigneeStats.completed = assignPoints.filter(p => p.status === 'Completed').length;
    assigneeDetails = users.find(u => u.name === selectedAssignee);
  }

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredPoints.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredPoints.length / rowsPerPage);

  if (loading || !meeting) return <div className="tracker-loading">Loading Tracker...</div>;

  return (
    <div className="mom-tracker-page">
      {/* History Modal */}
      {historyModalPointId && (
        <div className="history-modal-overlay">
          <div className="history-modal-content">
            <div className="history-modal-header">
              <h3>Action History</h3>
              <button className="history-close-btn" onClick={() => setHistoryModalPointId(null)}><X size={20} /></button>
            </div>
            <div className="history-timeline">
              {(() => {
                const point = points.find(p => p.id === historyModalPointId);
                const hist = point?.history || [];
                if (hist.length === 0) return <div className="history-empty">No actions recorded yet.</div>;
                return hist.slice().reverse().map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-item-icon"><Clock size={14}/></div>
                    <div className="history-item-details">
                      <div className="history-item-who">{h.who}</div>
                      <div className="history-item-action">
                        Changed <strong>{h.field}</strong> from <code>{h.oldValue || 'empty'}</code> to <code>{h.newValue || 'empty'}</code>
                      </div>
                      <div className="history-item-time">{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="tracker-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: '-10px', width: '100%' }}>
        {/* Left: Breadcrumbs */}
        <div className="tracker-top-nav" style={{ margin: 0, fontSize: '0.85rem' }}>
          <span style={{cursor: 'pointer', color: '#a0a3b1'}} onClick={() => navigate('/minutes')}>Minutes of Meeting</span>
          <span style={{margin: '0 8px', color: '#a0a3b1'}}>{'>'}</span>
          <span className="current" style={{color: '#f8ab37'}}>MOM Tracker</span>
        </div>
        
        {/* Center: Title */}
        <div className="tracker-title" style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
          <h2 style={{ color: '#f8ab37' }}>Minutes of Meeting</h2>
          <span className="tracker-badge">Tracker</span>
        </div>
        
        {/* Right: Actions */}
        <div className="tracker-actions" ref={actionsRef} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <div className="add-dropdown-container">
            <button className="export-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload Excel
            </button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleUploadExcel} 
            />
          </div>
          <div className="add-dropdown-container" style={{ position: 'relative' }}>
            <button className="export-btn" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
              <Download size={16} /> Export
            </button>
            {isExportMenuOpen && (
              <div className="add-dropdown-menu">
                <button className="export-opt-pdf" onClick={handleExportPdf}>Download PDF</button>
                <button className="export-opt-excel" onClick={handleExportExcel}>Download Excel (CSV)</button>
                <button className="export-opt-doc" onClick={handleExportDoc}>Download Doc</button>
              </div>
            )}
          </div>
          <div className="add-dropdown-container" style={{ position: 'relative' }}>
            <button className="add-point-btn" onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}>
              <Plus size={16} /> Add Action
            </button>
            {isAddMenuOpen && (
              <div className="add-dropdown-menu">
                <button onClick={() => { addPoint(); setIsAddMenuOpen(false); }}>Add Row</button>
                <button onClick={handleAddColumn}>Add Column</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="summary-cards-row" style={{ gridTemplateColumns: selectedAssignee ? 'repeat(8, 1fr)' : 'repeat(7, 1fr)' }}>
        <div className="summary-card card-overview">
          <div className="card-header">
            <LayoutList size={16} className="card-icon" />
            <span style={{ fontWeight: 'bold' }}>Status Overview</span>
          </div>
          <div className="card-body">
            <div className="card-label">Total Points</div>
            <div className="card-value">{totalPoints}</div>
          </div>
        </div>

        <div className="summary-card card-open">
          <div className="card-header">
            <span className="dot dot-open"></span>
            <span style={{ fontWeight: 'bold' }}>Open</span>
          </div>
          <div className="card-body">
            <div className="card-value">{openCount}</div>
            <div className="card-percent text-red">{getPercent(openCount)}%</div>
          </div>
        </div>

        <div className="summary-card card-inprogress">
          <div className="card-header">
            <span className="dot dot-inprogress"></span>
            <span style={{ fontWeight: 'bold' }}>In Progress</span>
          </div>
          <div className="card-body">
            <div className="card-value">{inProgressCount}</div>
            <div className="card-percent text-orange">{getPercent(inProgressCount)}%</div>
          </div>
        </div>

        <div className="summary-card card-pending">
          <div className="card-header">
            <span className="dot dot-pending"></span>
            <span style={{ fontWeight: 'bold' }}>Pending</span>
          </div>
          <div className="card-body">
            <div className="card-value">{pendingCount}</div>
            <div className="card-percent text-yellow">{getPercent(pendingCount)}%</div>
          </div>
        </div>

        <div className="summary-card card-completed">
          <div className="card-header">
            <span className="dot dot-completed"></span>
            <span style={{ fontWeight: 'bold' }}>Completed</span>
          </div>
          <div className="card-body">
            <div className="card-value">{completedCount}</div>
            <div className="card-percent text-green">{getPercent(completedCount)}%</div>
          </div>
        </div>

        <div className="summary-card card-staging">
          <div className="card-header">
            <Server size={14} className="card-icon" style={{color: '#a855f7', background: 'rgba(168,85,247,0.1)'}} />
            <span style={{ fontWeight: 'bold' }}>Staging Dep.</span>
          </div>
          <div className="card-body">
            <div className="card-value">{stagingCount}<span style={{fontSize: '1rem', color: '#a0a3b1'}}>{' '}/ {totalPoints}</span></div>
            <div className="card-percent" style={{color: '#a855f7'}}>{getPercent(stagingCount)}%</div>
          </div>
        </div>

        <div className="summary-card card-prod">
          <div className="card-header">
            <Cloud size={14} className="card-icon" style={{color: '#06b6d4', background: 'rgba(6,182,212,0.1)'}} />
            <span style={{ fontWeight: 'bold' }}>Prod Dep.</span>
          </div>
          <div className="card-body">
            <div className="card-value">{prodCount}<span style={{fontSize: '1rem', color: '#a0a3b1'}}>{' '}/ {totalPoints}</span></div>
            <div className="card-percent" style={{color: '#06b6d4'}}>{getPercent(prodCount)}%</div>
          </div>
        </div>

        {selectedAssignee && (
          <div className="summary-card card-assignee-summary">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="card-icon assignee-icon-placeholder">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <span style={{ fontWeight: 'bold' }}>Assignee</span>
              </div>
              <MoreHorizontal size={16} color="#a0a3b1" />
            </div>
            <div className="card-body" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px' }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {assigneeDetails ? `${assigneeDetails.name}` : 'All'}
              </div>
              <div className="assignee-stats-grid">
                <div className="stat-item">
                  <span className="stat-label text-blue">Assig</span>
                  <span className="stat-val text-blue">{assigneeStats.assigned}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-red">Open</span>
                  <span className="stat-val text-red">{assigneeStats.open}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-orange">In Prg</span>
                  <span className="stat-val text-orange">{assigneeStats.inProgress}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-yellow">Pend</span>
                  <span className="stat-val text-yellow">{assigneeStats.pending}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-green">Comp</span>
                  <span className="stat-val text-green">{assigneeStats.completed}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tracker-controls-panel">
        <div className="meta-col">
          <label>Meeting Date</label>
          <div className="meta-readonly-box">
            <Calendar size={16} />
            <span>{meeting.date}, {meeting.time}</span>
          </div>
        </div>

        <div className="meta-col">
          <label>Filter Assignee</label>
          <select 
            className="control-select" 
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {users.map(u => <option key={u.id} value={u.name}>{u.name} ({u.empId})</option>)}
          </select>
        </div>

        <div className="meta-col">
          <label>Filter Status</label>
          <select 
            className="control-select" 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="meta-col">
          <label>Filter Deployment</label>
          <select 
            className="control-select" 
            value={selectedDeployment}
            onChange={(e) => setSelectedDeployment(e.target.value)}
          >
            <option value="">All Points</option>
            <option value="Staging">Has Staging Date</option>
            <option value="Production">Has Production Date</option>
          </select>
        </div>

        <div className="meta-right">
          <span className="total-points-box">Total Points: {totalPoints}</span>
          <div className="last-updated">
            <span className={saveStatus === 'Saving...' ? 'text-orange' : saveStatus === 'All changes saved' ? 'text-green' : ''}>
              {saveStatus === 'Last Updated' 
                ? `Last Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}`
                : saveStatus}
            </span>
            <button className="refresh-btn" onClick={fetchData}><RefreshCw size={14} /></button>
          </div>
        </div>
      </div>

      <div className="tracker-table-container">
        <table className="tracker-table">
          <thead>
            <tr>
              <th className="freeze-col freeze-col-1">S.No <Edit2 size={12} className="th-icon" /></th>
              <th className="freeze-col freeze-col-2" style={{ minWidth: colWidths.pageName, width: colWidths.pageName }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <span>Page Name <Edit2 size={12} className="th-icon" /></span>
                  <div style={{display:'flex', gap:'2px'}}>
                    <button className="resize-btn" onClick={() => setColWidths(p => ({...p, pageName: Math.max(100, p.pageName - 50)}))} title="Decrease Width"><ChevronLeft size={12}/></button>
                    <button className="resize-btn" onClick={() => setColWidths(p => ({...p, pageName: p.pageName + 50}))} title="Increase Width"><ChevronRight size={12}/></button>
                  </div>
                </div>
              </th>
              <th className="freeze-col freeze-col-3" style={{ minWidth: colWidths.issue, width: colWidths.issue }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <span>Issue / Point <Edit2 size={12} className="th-icon" /></span>
                  <div style={{display:'flex', gap:'2px'}}>
                    <button className="resize-btn" onClick={() => setColWidths(p => ({...p, issue: Math.max(150, p.issue - 50)}))} title="Decrease Width"><ChevronLeft size={12}/></button>
                    <button className="resize-btn" onClick={() => setColWidths(p => ({...p, issue: p.issue + 50}))} title="Increase Width"><ChevronRight size={12}/></button>
                  </div>
                </div>
              </th>
              <th className="freeze-col freeze-col-4">Status <Plus size={12} className="th-icon" /></th>
              <th>Assignee <Edit2 size={12} className="th-icon" /></th>
              <th>Staging Deployment <Edit2 size={12} className="th-icon" /></th>
              <th>Production Deployment <Edit2 size={12} className="th-icon" /></th>
              {customColumns.map(col => (
                <th key={col}>{col} <Edit2 size={12} className="th-icon" /></th>
              ))}
              <th style={{width: '80px', textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((p, index) => {
              const assigneeUser = users.find(u => u.name === p.assignee);
              const currentStatusObj = statuses.find(st => st.name === p.status) || { name: p.status, color: '#f8ab37' };

              return (
                <tr key={p.id}>
                  <td className="text-center freeze-col freeze-col-1">{indexOfFirstRow + index + 1}</td>
                  
                  <td className="freeze-col freeze-col-2">
                    <input 
                      className="inline-input" 
                      type="text" 
                      value={p.pageName} 
                      onChange={e => updatePoint(p.id, 'pageName', e.target.value)} 
                      placeholder="Enter..."
                    />
                  </td>
                  
                  <td className="freeze-col freeze-col-3">
                    <textarea 
                      className="inline-textarea"
                      value={p.issue}
                      onChange={e => updatePoint(p.id, 'issue', e.target.value)}
                      placeholder="Describe issue..."
                    />
                  </td>

                  <td className="freeze-col freeze-col-4">
                    <div className="status-dropdown-wrapper" style={{ 
                      backgroundColor: `${currentStatusObj.color}22`, 
                      borderColor: `${currentStatusObj.color}55`,
                      boxShadow: `0 0 8px ${currentStatusObj.color}33`,
                      color: currentStatusObj.color,
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      borderRadius: '16px',
                      padding: '4px 8px'
                    }}>
                      <select 
                        className="status-select-real"
                        value={p.status || 'Open'}
                        style={{ color: currentStatusObj.color, appearance: 'none', background: 'transparent', border: 'none', width: '100%', paddingRight: '20px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'ADD_NEW_STATUS') {
                            setStatusDropdownTarget(p.id);
                            setIsStatusModalOpen(true);
                          } else {
                            handleStatusChange(p, val);
                          }
                        }}
                      >
                        {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        <option disabled>──────────</option>
                        <option value="ADD_NEW_STATUS" style={{color: '#f8ab37'}}>+ Add New Status</option>
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: currentStatusObj.color }} />
                    </div>
                  </td>

                  <td>
                    <div className="inline-assignee-wrapper">
                      {assigneeUser && <img src={assigneeUser.avatar} alt="avatar" className="inline-avatar" />}
                      {!assigneeUser && <div className="inline-avatar-placeholder"><Search size={12}/></div>}
                      <select 
                        className="inline-select"
                        value={p.assignee}
                        onChange={e => updatePoint(p.id, 'assignee', e.target.value)}
                      >
                        <option value="">Select...</option>
                        {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                  </td>

                  <td>
                    <div className="inline-date-wrapper">
                      <input 
                        type="date"
                        className="inline-date"
                        value={p.stagingDate}
                        onChange={e => updatePoint(p.id, 'stagingDate', e.target.value)}
                      />
                    </div>
                  </td>

                  <td>
                    <div className="inline-date-wrapper">
                      <input 
                        type="date"
                        className="inline-date"
                        value={p.prodDate}
                        onChange={e => updatePoint(p.id, 'prodDate', e.target.value)}
                      />
                    </div>
                  </td>

                  {customColumns.map(col => (
                    <td key={col}>
                      <input 
                        className="inline-input"
                        type="text"
                        value={p[col] || ''}
                        onChange={e => updatePoint(p.id, col, e.target.value)}
                        placeholder="Enter..."
                      />
                    </td>
                  ))}

                  <td className="text-center" style={{display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', height: '100%', borderBottom: 'none'}}>
                    <button className="tracker-action-btn" title="View History" onClick={() => setHistoryModalPointId(p.id)}>
                      <Clock size={16} />
                    </button>
                    <button className="tracker-del-btn" title="Delete Row" onClick={() => removePoint(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {currentRows.length === 0 && (
              <tr><td colSpan={8 + customColumns.length} style={{textAlign: 'center', padding: '32px', color: '#a0a3b1'}}>No points found matching filters.</td></tr>
            )}
          </tbody>
        </table>
        
        <div className="tracker-pagination-footer">
          <div className="tp-left">
            <span>Rows per page:</span>
            <select className="tp-select" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>Showing {filteredPoints.length === 0 ? 0 : indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredPoints.length)} of {filteredPoints.length} entries</span>
          </div>
          <div className="tp-right">
            <button className="tp-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14}/></button>
            <span className="tp-page active">{currentPage}</span>
            <button className="tp-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {isStatusModalOpen && (
        <div className="history-modal-overlay" onClick={() => setIsStatusModalOpen(false)}>
          <div className="history-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
            <div className="history-modal-header">
              <h3>Create Custom Status</h3>
              <button className="history-modal-close" onClick={() => setIsStatusModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="history-modal-body" style={{padding: '24px'}}>
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#a0a3b1'}}>Status Name</label>
                <input 
                  type="text" 
                  value={newStatusName} 
                  onChange={e => setNewStatusName(e.target.value)} 
                  placeholder="e.g. Blocked"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#a0a3b1'}}>Select Color</label>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {PRESET_COLORS.map(color => (
                    <div 
                      key={color}
                      onClick={() => setNewStatusColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: newStatusColor === color ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: newStatusColor === color ? `0 0 12px ${color}` : 'none',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>
              <button 
                onClick={handleAddStatusSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f8ab37',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomTracker;
