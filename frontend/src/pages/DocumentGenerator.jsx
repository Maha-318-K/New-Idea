import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Eye, Download, Trash2, X, ChevronRight, CheckCircle, Clock, AlertTriangle, Send, Settings2, History 
} from 'lucide-react';
import './DocumentGenerator.css';
import logoImg from '../assets/logo.png'; // Assuming logo is available
import html2pdf from 'html2pdf.js';

const DocumentGenerator = () => {
  const [view, setView] = useState('list'); // 'list' | 'wizard' | 'preview'
  const [documents, setDocuments] = useState([]);
  
  // Wizard State
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('Project Status Report');
  const [filters, setFilters] = useState({
    requirements: { selected: false, from: '', to: '' },
    mom: { selected: false, from: '', to: '' },
    qaIssues: { selected: false, from: '', to: '' },
    prodIssues: { selected: false, from: '', to: '' }
  });

  const [reportData, setReportData] = useState(null);

  // WhatsApp Send Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [documentToSend, setDocumentToSend] = useState(null);
  const [waChats, setWaChats] = useState([]);
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [selectedChat, setSelectedChat] = useState('');
  const [waConfig, setWaConfig] = useState(null);

  // WhatsApp Settings Modal
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');

  useEffect(() => {
    if (view === 'list') {
      fetchDocuments();
      fetchWaData();
    }
  }, [view]);

  const fetchWaData = async () => {
    try {
      const configRes = await fetch('/api/v1/whatsapp/status');
      const configData = await configRes.json();
      setWaConfig(configData);
      
      const chatRes = await fetch('/api/v1/whatsapp/chats');
      const chatData = await chatRes.json();
      setWaChats(Array.isArray(chatData) ? chatData : (chatData.data || []));
      if (configData.issueDefaultGroup) {
        setSelectedChat(configData.issueDefaultGroup);
      }
    } catch (e) {
      console.error(e);
      setWaChats([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/v1/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (e) {
      console.error(e);
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
      fetchWaData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    try {
      const payload = {
        documentName: documentName || 'Untitled Document',
        documentType,
        createdBy: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), // Replace with real user if available
        filters
      };
      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
        setView('preview');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/v1/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (e) {
      console.error(e);
    }
  };

  const exportToPDF = () => {
    window.print(); // Triggers browser print, tailored via CSS @media print
  };

  const exportToWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>table {border-collapse: collapse; width: 100%;} th, td {border: 1px solid #ddd; padding: 8px;} th {background-color: #f2f2f2;}</style></head><body>";
    const footer = "</body></html>";
    const previewContent = document.getElementById("document-preview-content").innerHTML;
    const sourceHTML = header + previewContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${documentName || 'Document'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const toggleFilter = (key) => {
    setFilters({ ...filters, [key]: { ...filters[key], selected: !filters[key].selected } });
  };

  const updateFilterDate = (key, field, value) => {
    setFilters({ ...filters, [key]: { ...filters[key], [field]: value } });
  };

  const handleSendToWhatsApp = async () => {
    if (!selectedChat || !documentToSend) return;
    
    // Check if we are in preview mode or list mode
    // If in list mode without preview rendered, we just send summary for now
    // Or we can add logic to render it. For the sake of simplicity, we'll try to capture the preview if available.
    let attachmentUrl = null;
    
    const previewEl = document.getElementById("document-preview-content");
    if (previewEl) {
      try {
        const opt = {
          margin: 0.5,
          filename: `${documentToSend.documentName || 'Document'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        const pdfBlob = await html2pdf().set(opt).from(previewEl).output('blob');
        
        const uploadForm = new FormData();
        uploadForm.append('files', pdfBlob, opt.filename);
        
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: uploadForm
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls.length > 0) {
          attachmentUrl = uploadData.urls[0];
        }
      } catch (err) {
        console.error("Failed to generate/upload PDF", err);
      }
    }

    try {
      const payload = {
        chatId: selectedChat,
        documentName: documentToSend.documentName,
        documentType: documentToSend.documentType,
        generatedDate: documentToSend.generatedDate,
        attachmentUrl: attachmentUrl,
        user: (JSON.parse(localStorage.getItem('user'))?.name || 'System')
      };
      await fetch('/api/v1/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Update history
      const selectedChatName = waChats.find(c => c.id === selectedChat)?.name || selectedChat;
      await fetch(`/api/v1/documents/${documentToSend.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyEntry: { action: `Sent to WhatsApp (${selectedChatName})`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() }
        })
      });

      setShowSendModal(false);
      setDocumentToSend(null);
      fetchDocuments();
      alert('Document sent successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to send document.');
    }
  };

  // UI Renders
  if (view === 'list') {
    return (
      <div className="doc-page">
        <div className="doc-header" style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <h2>Document Generator</h2>
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
            <button className="doc-btn-secondary" onClick={() => { setShowWaSettings(true); fetchWaData(); }}>
              <Settings2 size={16} /> WhatsApp Settings
            </button>
          </div>
          <button className="doc-btn-primary" onClick={() => { setView('wizard'); }}>
            <Plus size={16} /> Generate New Document
          </button>
        </div>

        <div className="doc-table-container">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Document Name</th>
                <th>Document Type</th>
                <th>Created By</th>
                <th>Generated Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No documents found.</td></tr>
              ) : documents.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.documentId}</td>
                  <td>{doc.documentName}</td>
                  <td>{doc.documentType}</td>
                  <td>{doc.createdBy}</td>
                  <td>{doc.generatedDate}</td>
                  <td><span className="doc-badge">{doc.status}</span></td>
                  <td>
                    <div className="doc-actions">
                      <button title="View History" onClick={() => { setHistoryDoc(doc); setShowHistoryModal(true); }}>
                        <History size={16} color="#f8ab37" />
                      </button>
                      <button title="Send to WhatsApp" onClick={() => { setDocumentToSend(doc); setShowSendModal(true); }}>
                        <Send size={16} color="#f8ab37" />
                      </button>
                      <button title="Delete" onClick={() => handleDelete(doc.id)}><Trash2 size={16} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WhatsApp Send Modal */}
        {showSendModal && (
          <div className="qa-modal-overlay" onClick={() => setShowSendModal(false)}>
            <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Send size={20} color="#f8ab37" />
                  <h3 style={{margin: 0}}>Send via WhatsApp</h3>
                </div>
                <X size={20} className="qa-modal-close" onClick={() => setShowSendModal(false)} />
              </div>

              {waConfig?.status !== 'Connected' ? (
                <div style={{textAlign: 'center', padding: '24px 0'}}>
                  <AlertTriangle size={32} color="#f8ab37" style={{marginBottom: '12px'}} />
                  <p style={{color: '#a0a3b1', marginBottom: 0}}>WhatsApp is not connected. Please connect it in settings.</p>
                </div>
              ) : (
                <>
                  <p style={{color: '#a0a3b1', fontSize: '13px', marginBottom: '20px'}}>
                    Send a summary of <strong>{documentToSend?.documentName}</strong> to a group or contact.
                  </p>
                  
                  <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Select Destination</label>
                  <select 
                    className="doc-field select" 
                    style={{width: '100%', background: '#1a1b23', border: '1px solid #3f424f', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px'}}
                    value={selectedChat} 
                    onChange={e => setSelectedChat(e.target.value)}
                  >
                    <option value="">Select a group or contact...</option>
                    {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  <button className="doc-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={handleSendToWhatsApp}>
                    <Send size={16} /> Send Document Summary
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Settings Modal */}
        {showWaSettings && waConfig && (
          <div className="qa-modal-overlay" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>
            <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px'}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '20px'}}/> 
                  Document WhatsApp Configuration
                </h3>
                <X size={20} className="qa-modal-close" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }} />
              </div>
              
              <div style={{padding: '16px 0'}}>
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
                    <span style={{color: 'inherit', fontWeight: 500}}>Default Document Group</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {!isChangingGroup ? (
                        <>
                          <span style={{color: 'inherit', fontWeight: 500}}>
                            {waConfig.issueDefaultGroup ? waChats.find(c => c.id === waConfig.issueDefaultGroup)?.name || waConfig.issueDefaultGroup : 'Not Configured'}
                          </span>
                          {waConfig.status === 'Connected' && (
                            <button style={{background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={() => { setIsChangingGroup(true); fetchWaData(); }}>Change</button>
                          )}
                        </>
                      ) : (
                        <div style={{display: 'flex', gap: '8px'}}>
                          <select className="doc-field select" style={{background: 'var(--bg-secondary, #fff)', width: '150px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color, #d1d5db)', color: 'inherit'}} value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)}>
                            <option value="">Select Group...</option>
                            {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <button style={{background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={saveWaGroup}>Save</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && historyDoc && (
          <div className="qa-modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="qa-modal" onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <History size={20} color="#f8ab37" />
                  <h3 style={{margin: 0}}>Action History — {historyDoc.documentName}</h3>
                </div>
                <X size={20} className="qa-modal-close" onClick={() => setShowHistoryModal(false)} />
              </div>
              <div className="qa-history-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                {(!historyDoc.history || historyDoc.history.length === 0) ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No history recorded yet.</p>
                ) : (
                  historyDoc.history.slice().reverse().map((h, i) => (
                    <div key={i} className="qa-history-item" style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                      <span style={{color: '#f8ab37', flexShrink: 0}}>[{new Date(h.date).toLocaleString()}]</span>
                      <span style={{fontWeight: 500, color: '#fff', flexShrink: 0}}>{h.by}</span>
                      <span style={{color: '#a0a3b1'}}>{h.action}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'wizard') {
    return (
      <div className="doc-page">
        <div className="doc-breadcrumbs">
          <span className="crumb-link" onClick={() => setView('list')}>Documents</span>
          <ChevronRight size={14} className="crumb-sep" />
          <span className="current">Create Document</span>
        </div>

        <div className="doc-wizard-card">
          <div className="doc-wizard-header">
            <h3>Document Configuration</h3>
            <p>Enter document details and select data sources.</p>
          </div>

          <div className="doc-wizard-body">
            <div className="doc-field">
              <label>Document Name</label>
              <input type="text" placeholder="e.g. May 2025 Status Report" value={documentName} onChange={e => setDocumentName(e.target.value)} />
            </div>
            <div className="doc-field">
              <label>Document Type</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)}>
                <option>Project Status Report</option>
                <option>Weekly Report</option>
                <option>Monthly Report</option>
                <option>Production Release Report</option>
                <option>Client Update Report</option>
                <option>Custom Report</option>
              </select>
            </div>
            
            <h4 style={{marginTop: '24px', marginBottom: '16px', color: '#fff'}}>Select Data Sources & Filters</h4>
            <div className="doc-sources-grid">
                {[
                  { key: 'requirements', label: 'Requirements' },
                  { key: 'mom', label: 'Minutes Of Meeting' },
                  { key: 'qaIssues', label: 'QA Issues' },
                  { key: 'prodIssues', label: 'Production Issues' }
                ].map(src => (
                  <div className={`doc-source-card ${filters[src.key].selected ? 'selected' : ''}`} key={src.key}>
                    <label className="doc-checkbox">
                      <input type="checkbox" checked={filters[src.key].selected} onChange={() => toggleFilter(src.key)} />
                      <span>{src.label}</span>
                    </label>
                    {filters[src.key].selected && (
                      <div className="doc-date-filters">
                        <div>
                          <label>From Date</label>
                          <input type="date" value={filters[src.key].from} onChange={e => updateFilterDate(src.key, 'from', e.target.value)} />
                        </div>
                        <div>
                          <label>To Date</label>
                          <input type="date" value={filters[src.key].to} onChange={e => updateFilterDate(src.key, 'to', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="doc-wizard-actions" style={{marginTop: '24px'}}>
                <button className="doc-btn-secondary" onClick={() => setView('list')}>Cancel</button>
                <button className="doc-btn-primary" onClick={handleGenerate}>Generate Document</button>
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'preview' && reportData) {
    const { requirements, mom, qaIssues, prodIssues, metadata } = reportData;
    
    // Stats calc
    const reqCompleted = requirements.filter(r => r.status === 'Completed' || r.status === 'Approved').length;
    const qaOpen = qaIssues.filter(q => q.status !== 'Resolved' && q.status !== 'Closed').length;
    const prodOpen = prodIssues.filter(p => p.status !== 'Resolved' && p.status !== 'Closed').length;

    return (
      <div className="doc-page">
        <div className="doc-preview-toolbar no-print">
          <button className="doc-btn-secondary" onClick={() => setView('list')}><X size={16} /> Close Preview</button>
          <div style={{display: 'flex', gap: '12px'}}>
            <button className="doc-btn-primary" onClick={() => { setDocumentToSend(metadata); setShowSendModal(true); }}><Send size={16} /> Send to WhatsApp</button>
            <button className="doc-btn-primary" onClick={exportToWord}><Download size={16} /> Download Word</button>
            <button className="doc-btn-primary" onClick={exportToPDF}><Download size={16} /> Download PDF</button>
          </div>
        </div>

        <div className="doc-preview-wrapper">
          <div id="document-preview-content" className="doc-printable-area">
            
            {/* COVER PAGE */}
            <div className="doc-cover-page">
              <img src={logoImg} alt="Logo" className="doc-cover-logo" />
              <h1 className="doc-cover-title">{metadata.documentName}</h1>
              <h2 className="doc-cover-subtitle">{metadata.documentType}</h2>
              <div className="doc-cover-details">
                <p><strong>Generated Date:</strong> {metadata.generatedDate}</p>
                <p><strong>Prepared By:</strong> {metadata.createdBy}</p>
              </div>
            </div>

            <div className="doc-page-break"></div>

            {/* EXECUTIVE SUMMARY */}
            <div className="doc-section">
              <h2 className="doc-section-title">Executive Summary</h2>
              <p className="doc-text">
                This report contains project progress, completed requirements, meeting discussions, QA issues and production issues based on the selected date ranges. 
                During this period, {reqCompleted} requirements were marked as complete, {qaIssues.length} QA issues were identified (with {qaOpen} still open), and {prodIssues.length} production issues were reported. Overall progress remains steady.
              </p>
            </div>

            {/* REQUIREMENTS SECTION */}
            {filters.requirements.selected && requirements.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Requirements Status</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {requirements.length}</div>
                  <div className="doc-stat-box"><strong>Completed:</strong> {reqCompleted}</div>
                  <div className="doc-stat-box"><strong>Pending:</strong> {requirements.length - reqCompleted}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Name</th>
                      <th>Module</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.title}</td>
                        <td>{r.module}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MOM SECTION */}
            {filters.mom.selected && mom.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Meeting Discussions</h2>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Agenda</th>
                      <th>Attendees</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mom.map(m => (
                      <tr key={m.id}>
                        <td>{m.date}</td>
                        <td>{m.agendaTitle}</td>
                        <td>{m.attendees}</td>
                        <td>{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* QA ISSUES SECTION */}
            {filters.qaIssues.selected && qaIssues.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">QA Defect Summary</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {qaIssues.length}</div>
                  <div className="doc-stat-box" style={{color: 'red'}}><strong>Open:</strong> {qaOpen}</div>
                  <div className="doc-stat-box" style={{color: 'green'}}><strong>Resolved:</strong> {qaIssues.length - qaOpen}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Issue ID</th>
                      <th>Module</th>
                      <th>Issue</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaIssues.map(q => (
                      <tr key={q.id}>
                        <td>{q.issueId}</td>
                        <td>{q.module}</td>
                        <td>{q.issueTitle}</td>
                        <td>{q.severity}</td>
                        <td>{q.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PROD ISSUES SECTION */}
            {filters.prodIssues.selected && prodIssues.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Production Issue Summary</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {prodIssues.length}</div>
                  <div className="doc-stat-box" style={{color: 'red'}}><strong>Open:</strong> {prodOpen}</div>
                  <div className="doc-stat-box" style={{color: 'green'}}><strong>Resolved:</strong> {prodIssues.length - prodOpen}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Issue ID</th>
                      <th>Module</th>
                      <th>Issue</th>
                      <th>Status</th>
                      <th>Raised Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodIssues.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.pageName}</td>
                        <td>{p.issue}</td>
                        <td>{p.status}</td>
                        <td>{p.raisedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DocumentGenerator;
