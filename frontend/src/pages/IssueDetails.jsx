import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowLeft, Edit2, Calendar, User, 
  Copy, Image as ImageIcon, Film, FileText, Download,
  CheckCircle2, Clock, PlayCircle, MessageCircle, ChevronDown, File
} from 'lucide-react';
import './IssueDetails.css';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await fetch(`/api/v1/issues/${id}`);
        const data = await res.json();
        if (data.success) {
          setIssue(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch issue details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  if (loading) return <div style={{ color: '#fff', padding: '50px' }}>Loading...</div>;
  if (!issue) return <div style={{ color: '#fff', padding: '50px' }}>Issue not found</div>;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="id-page-container">
      {/* ── Breadcrumbs ── */}
      <div className="id-breadcrumbs">
        <span className="crumb-link" onClick={() => navigate('/issues')}>Production Issues</span>
        <ChevronRight size={14} className="crumb-sep" />
        <span className="current">Issue Details</span>
      </div>

      {/* ── Header ── */}
      <div className="id-header">
        <div className="id-header-title">
          <h1>{issue.issue}</h1>
          <div className="id-status-badge">
            <span className="id-priority-dot" style={{ background: issue.status === 'Closed' ? '#22c55e' : issue.status === 'In Progress' ? '#f8ab37' : '#ef4444' }}></span>
            {issue.status}
          </div>
        </div>
        <div className="id-header-actions">
          <button className="id-btn" onClick={() => navigate('/issues')}>
            <ArrowLeft size={15} /> Back to List
          </button>
          <button className="id-btn id-btn-primary">
            <Edit2 size={15} /> Edit Issue
          </button>
        </div>
      </div>

      {/* ── Top Meta Card ── */}
      <div className="id-meta-card">
        <div className="id-tags">
          <span className="id-tag">#{issue.pageName}</span>
          <span className="id-tag">#Authentication</span>
        </div>
        <div className="id-meta-grid">
          <div className="id-meta-item">
            <span className="id-meta-label">Priority</span>
            <span className="id-meta-val"><span className="id-priority-dot"></span> High</span>
          </div>
          <div className="id-meta-item">
            <span className="id-meta-label">Reported On</span>
            <span className="id-meta-val">
              {issue.raisedDate}
              <Copy size={13} style={{ cursor: 'pointer', color: '#a1a1aa' }} onClick={() => handleCopy(issue.raisedDate)} />
            </span>
          </div>
          <div className="id-meta-item">
            <span className="id-meta-label">Reported By (Client)</span>
            <span className="id-meta-val" style={{ color: '#22c55e' }}>
              <MessageCircle size={15} /> Rajesh (Client)
            </span>
          </div>
          <div className="id-meta-item">
            <span className="id-meta-label">Status</span>
            <div className="id-btn" style={{ padding: '6px 12px', width: 'fit-content' }}>
              <span className="id-priority-dot" style={{ background: issue.status === 'Closed' ? '#22c55e' : '#f8ab37' }}></span>
              {issue.status} <ChevronDown size={13} style={{ marginLeft: 4 }} />
            </div>
          </div>
          <div className="id-meta-item">
            <span className="id-meta-label">Issue ID</span>
            <span className="id-meta-val">
              PI-2025-000{issue.id}
              <Copy size={13} style={{ cursor: 'pointer', color: '#a1a1aa' }} onClick={() => handleCopy(`PI-2025-000${issue.id}`)} />
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="id-main-grid">
        
        {/* LEFT COLUMN */}
        <div className="id-left-col">
          
          {/* Issue Info */}
          <div className="id-card">
            <h3 className="id-card-title"><FileText size={16} /> Issue Information</h3>
            <table className="id-info-table">
              <tbody>
                <tr>
                  <td>Page Name</td>
                  <td>{issue.pageName}</td>
                </tr>
                <tr>
                  <td>Issue Description</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{issue.issue}</td>
                </tr>
                <tr>
                  <td>Expected Time</td>
                  <td>02 Jun 2025</td>
                </tr>
                <tr>
                  <td>Assignee</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    <img src={`https://i.pravatar.cc/150?u=${issue.assignee || 'default'}`} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                    {issue.assignee || 'Unassigned'}
                  </td>
                </tr>
                <tr>
                  <td>Priority</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="id-priority-dot"></span> High</td>
                </tr>
                <tr>
                  <td>Days to Resolve</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>Staging Deployment Date</td>
                  <td>31 May 2025</td>
                </tr>
                <tr>
                  <td>Production Deployment Date</td>
                  <td>{issue.deployDate}</td>
                </tr>
                <tr>
                  <td>Attachments ({Array.isArray(issue.attachments) ? issue.attachments.length : 0})</td>
                  <td>
                    <div className="id-attachments">
                      {Array.isArray(issue.attachments) && issue.attachments.map((att, i) => (
                        <div key={i} className="id-attach-item">
                          <div className="id-attach-preview" style={{ overflow: 'hidden' }}>
                            {att.type === 'image' && att.url ? (
                              <a href={`http://localhost:5000${att.url}`} target="_blank" rel="noreferrer">
                                <img src={`http://localhost:5000${att.url}`} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </a>
                            ) : att.type === 'image' ? (
                              <ImageIcon size={24} className="id-attach-icon" />
                            ) : (
                              <PlayCircle size={24} className="id-attach-icon" />
                            )}
                          </div>
                          <div className="id-attach-info">
                            <div className="id-attach-name" title={att.name}>{att.name}</div>
                            <div className="id-attach-meta">
                              <span>1.2 MB</span>
                              <Download size={12} style={{ cursor: 'pointer' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Notes</td>
                  <td>Please check the attached screenshot and video. This issue is impacting multiple users.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div className="id-card">
            <h3 className="id-card-title" style={{ color: '#f8ab37' }}><Clock size={16} /> Deployment & Timeline</h3>
            <div className="id-timeline">
              <div className="id-timeline-line"></div>
              
              <div className="id-timeline-node completed">
                <div className="id-timeline-icon"><FileText size={14} /></div>
                <div className="id-timeline-content">
                  <h4>Issue Reported</h4>
                  <p>{issue.raisedDate.split(',')[0]}</p>
                </div>
              </div>
              
              <div className="id-timeline-node completed">
                <div className="id-timeline-icon"><User size={14} /></div>
                <div className="id-timeline-content">
                  <h4>Assigned</h4>
                  <p>{issue.raisedDate.split(',')[0]}</p>
                </div>
              </div>
              
              <div className="id-timeline-node active">
                <div className="id-timeline-icon"><CheckCircle2 size={14} /></div>
                <div className="id-timeline-content">
                  <h4>Staging Deployed</h4>
                  <p>31 May 2025</p>
                </div>
              </div>
              
              <div className="id-timeline-node">
                <div className="id-timeline-icon"><Clock size={14} /></div>
                <div className="id-timeline-content">
                  <h4>Production Deployed</h4>
                  <p>-</p>
                </div>
              </div>
              
              <div className="id-timeline-node">
                <div className="id-timeline-icon"><CheckCircle2 size={14} /></div>
                <div className="id-timeline-content">
                  <h4>Resolved</h4>
                  <p>-</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="id-right-col">
          <div className="id-card id-chat-card">
            <div className="id-chat-header">
              <MessageCircle size={16} color="#22c55e" /> WhatsApp Messages (via Client)
            </div>
            
            <div className="id-chat-body">
              <div className="id-msg">
                <div className="id-msg-meta">
                  <span className="id-msg-sender">Rajesh (Client)</span>
                  <span className="id-msg-time">30 May 2025, 11:21 AM</span>
                </div>
                <div className="id-msg-bubble">
                  Login button not working on mobile.
                  <div className="id-msg-media" style={{ height: 100, background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={24} color="#71717a" />
                  </div>
                </div>
              </div>

              <div className="id-msg">
                <div className="id-msg-meta">
                  <span className="id-msg-sender">Rajesh (Client)</span>
                  <span className="id-msg-time">30 May 2025, 11:23 AM</span>
                </div>
                <div className="id-msg-bubble">
                  Getting error after clicking login.
                  <div className="id-msg-media" style={{ height: 100, background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={24} color="#71717a" />
                  </div>
                </div>
              </div>

              <div className="id-msg">
                <div className="id-msg-meta">
                  <span className="id-msg-sender">Rajesh (Client)</span>
                  <span className="id-msg-time">30 May 2025, 11:25 AM</span>
                </div>
                <div className="id-msg-bubble">
                  Please check and fix ASAP.
                  <div className="id-msg-file">
                    <File size={20} className="id-msg-file-icon" />
                    <div className="id-msg-file-info">
                      <div className="id-msg-file-name">error_log_30052025.txt</div>
                      <div className="id-msg-file-size">12 KB</div>
                    </div>
                    <Download size={14} style={{ color: '#a1a1aa', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>

            </div>

            <div className="id-chat-footer">
              <span>View More Messages <ChevronDown size={13} /></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IssueDetails;
