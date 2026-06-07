import React, { useState, useEffect } from 'react';
import { Download, Send, CheckCircle, FileText, AlertTriangle, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import logoImg from '../assets/logo.png';
import './QAReports.css';

const QAReports = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reportType, setReportType] = useState('Daily'); // Daily, Weekly, Monthly, Project
  const [testerName, setTesterName] = useState('');
  const [uniqueTesters, setUniqueTesters] = useState([]);
  
  // WhatsApp Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waChats, setWaChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchIssues();
    fetchWaChats();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/v1/qa-issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
        
        // Extract unique testers
        const testers = new Set();
        data.data.forEach(i => {
          if (i.assignedTo) testers.add(i.assignedTo);
          if (i.raisedBy) testers.add(i.raisedBy);
        });
        setUniqueTesters(Array.from(testers));
        
        // Auto-select first tester if none selected
        if (!testerName && testers.size > 0) {
          setTesterName(Array.from(testers)[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch issues", err);
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

  // Helper to filter issues based on report type and tester
  const getFilteredIssues = () => {
    let filtered = issues.filter(i => 
      !testerName || i.assignedTo === testerName || i.raisedBy === testerName
    );

    const now = new Date();
    filtered = filtered.filter(i => {
      if (!i.raisedDate) return false;
      const raised = new Date(i.raisedDate);
      if (isNaN(raised)) return false;

      const diffTime = Math.abs(now - raised);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (reportType === 'Daily') return diffDays <= 1;
      if (reportType === 'Weekly') return diffDays <= 7;
      if (reportType === 'Monthly') return diffDays <= 30;
      return true; // Project (All time)
    });

    return filtered;
  };

  const filteredIssues = getFilteredIssues();

  const handleSelectAll = () => {
    if (selectedIds.length === filteredIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIssues.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedIssuesData = issues.filter(i => selectedIds.includes(i.id));

  // PDF Generation
  const generatePDF = async () => {
    const el = document.getElementById('qa-report-content');
    if (!el) return null;

    const opt = {
      margin: 0.5,
      filename: `QA_${reportType}_Report_${testerName || 'All'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    return await html2pdf().set(opt).from(el).output('blob');
  };

  const handleDownload = async () => {
    if (selectedIds.length === 0) return alert("Please select at least one issue.");
    const el = document.getElementById('qa-report-content');
    const opt = {
      margin: 0.5,
      filename: `QA_${reportType}_Report_${testerName || 'All'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
  };

  const handleSendWhatsApp = async () => {
    if (!selectedChat) return alert("Please select a chat.");
    if (selectedIds.length === 0) return alert("Please select at least one issue.");
    
    setIsSending(true);
    try {
      const pdfBlob = await generatePDF();
      if (!pdfBlob) throw new Error("Could not generate PDF");

      const uploadForm = new FormData();
      uploadForm.append('files', pdfBlob, `QA_${reportType}_Report_${testerName}.pdf`);
      
      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        body: uploadForm
      });
      const uploadData = await uploadRes.json();
      
      let attachmentUrl = null;
      if (uploadData.success && uploadData.urls.length > 0) {
        attachmentUrl = uploadData.urls[0];
      }

      const payload = {
        chatId: selectedChat,
        documentName: `${reportType} QA Report - ${testerName}`,
        documentType: 'QA Report',
        generatedDate: new Date().toLocaleDateString(),
        attachmentUrl: attachmentUrl,
        user: (JSON.parse(localStorage.getItem('user'))?.name || 'System')
      };

      await fetch('/api/v1/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert("Report sent successfully!");
      setShowWaModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send report.");
    } finally {
      setIsSending(false);
    }
  };

  // Report Metrics
  const criticalCount = selectedIssuesData.filter(i => i.severity === 'Critical').length;
  const highCount = selectedIssuesData.filter(i => i.severity === 'High').length;
  const openCount = selectedIssuesData.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
  const resolvedCount = selectedIssuesData.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;

  return (
    <div className="qa-rep-page">
      <div className="qa-rep-header">
        <div>
          <h2>QA Tester Reports</h2>
          <p>Generate daily, weekly, or monthly reports of your testing progress to share with management.</p>
        </div>
      </div>

      <div className="qa-rep-filters">
        <select className="qa-rep-select" value={testerName} onChange={e => { setTesterName(e.target.value); setSelectedIds([]); }}>
          <option value="">Select Tester...</option>
          {uniqueTesters.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        {['Daily', 'Weekly', 'Monthly', 'Project'].map(t => (
          <button 
            key={t}
            className={`qa-rep-filter-btn ${reportType === t ? 'active' : ''}`}
            onClick={() => { setReportType(t); setSelectedIds([]); }}
          >
            {t} Report
          </button>
        ))}
      </div>

      <div className="qa-rep-content">
        {/* Left: Issues Selection */}
        <div className="qa-rep-list-panel">
          <div className="qa-rep-list-header">
            <h3>Select Issues ({filteredIssues.length} found)</h3>
            <button className="qa-rep-filter-btn" onClick={handleSelectAll}>
              {selectedIds.length === filteredIssues.length && filteredIssues.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="qa-rep-list-body">
            {filteredIssues.length === 0 ? (
              <div className="qa-rep-empty">No issues found for the selected filters.</div>
            ) : (
              filteredIssues.map(iss => (
                <div key={iss.id} className={`qa-rep-issue-item ${selectedIds.includes(iss.id) ? 'selected' : ''}`} onClick={() => toggleSelect(iss.id)}>
                  <input type="checkbox" className="qa-rep-checkbox" checked={selectedIds.includes(iss.id)} onChange={() => {}} />
                  <div className="qa-rep-issue-details">
                    <div className="qa-rep-issue-title">{iss.issueId}: {iss.issueTitle}</div>
                    <div className="qa-rep-issue-meta">
                      <span>Status: <strong style={{color: iss.status === 'Resolved' ? '#22c55e' : '#f8ab37'}}>{iss.status}</strong></span>
                      <span>Severity: {iss.severity}</span>
                      <span>Module: {iss.module}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Report Preview */}
        <div className="qa-rep-preview-panel">
          <div className="qa-rep-preview-header">
            <h3 style={{color: '#fff', margin: 0, fontWeight: 500}}>Report Preview</h3>
            <div className="qa-rep-preview-actions">
              <button className="qa-rep-btn-primary" onClick={handleDownload} disabled={selectedIds.length === 0}>
                <Download size={14} /> Download PDF
              </button>
              <button className="qa-rep-btn-primary" onClick={() => setShowWaModal(true)} disabled={selectedIds.length === 0}>
                <Send size={14} /> Send to WhatsApp
              </button>
            </div>
          </div>
          
          <div className="qa-rep-preview-body">
            {selectedIds.length === 0 ? (
              <div className="qa-rep-empty">
                <FileText size={48} color="#2a2c33" style={{marginBottom: 16}} />
                Select issues from the list to generate a report preview.
              </div>
            ) : (
              <div id="qa-report-content" className="qa-rep-document">
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
                  {logoImg && <img src={logoImg} alt="Logo" style={{height: 40}} />}
                </div>
                <div className="qa-rep-doc-title">QA {reportType} Report</div>
                <div className="qa-rep-doc-meta">
                  Prepared By: <strong>{testerName || 'All Testers'}</strong> | Date: {new Date().toLocaleDateString('en-GB')}
                </div>

                <div className="qa-rep-doc-section">
                  <div className="qa-rep-doc-section-title">Executive Summary</div>
                  <p style={{fontSize: 14, color: '#4b5563', lineHeight: 1.6}}>
                    This report details the QA findings and progress for the selected period. A total of <strong>{selectedIds.length}</strong> issues are included in this report. 
                    There are currently <strong>{openCount}</strong> open issues and <strong>{resolvedCount}</strong> resolved issues among the selection.
                    Attention is required for <strong>{criticalCount} Critical</strong> and <strong>{highCount} High</strong> severity defects.
                  </p>
                </div>

                <div className="qa-rep-doc-section">
                  <div className="qa-rep-doc-section-title">Detailed Issue List</div>
                  <table className="qa-rep-doc-table">
                    <thead>
                      <tr>
                        <th style={{width: '15%'}}>Issue ID</th>
                        <th style={{width: '15%'}}>Module</th>
                        <th style={{width: '40%'}}>Issue Description</th>
                        <th style={{width: '15%'}}>Severity</th>
                        <th style={{width: '15%'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIssuesData.map(iss => (
                        <tr key={iss.id}>
                          <td>{iss.issueId}</td>
                          <td>{iss.module}</td>
                          <td>{iss.issueTitle}</td>
                          <td style={{color: iss.severity === 'Critical' ? '#dc2626' : iss.severity === 'High' ? '#ea580c' : '#374151', fontWeight: 500}}>
                            {iss.severity}
                          </td>
                          <td style={{color: (iss.status === 'Resolved' || iss.status === 'Closed') ? '#16a34a' : '#d97706', fontWeight: 500}}>
                            {iss.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{marginTop: 40, fontSize: 12, color: '#9ca3af', textAlign: 'center'}}>
                  Generated via Madi Sarvopaya QA Workspace
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWaModal && (
        <div className="qa-modal-overlay" onClick={() => !isSending && setShowWaModal(false)}>
          <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Send size={20} color="#f8ab37" />
                <h3 style={{margin: 0}}>Send Report to Manager/CEO</h3>
              </div>
              <X size={20} className="qa-modal-close" onClick={() => !isSending && setShowWaModal(false)} />
            </div>

            <p style={{color: '#a0a3b1', fontSize: '13px', marginBottom: '20px'}}>
              This will generate the PDF report and send it to the selected WhatsApp contact or group.
            </p>
            
            <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Select Destination</label>
            <select 
              className="qa-rep-select" 
              style={{width: '100%', marginBottom: '24px'}}
              value={selectedChat} 
              onChange={e => setSelectedChat(e.target.value)}
            >
              <option value="">Select a manager or group...</option>
              {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <button className="qa-rep-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={handleSendWhatsApp} disabled={isSending}>
              {isSending ? 'Generating & Sending...' : 'Send WhatsApp Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReports;
