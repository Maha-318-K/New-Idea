import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { ProjectContext } from '../context/ProjectContext';
import { 
  ArrowRight, 
  ChevronDown, 
  Calendar,
  LayoutGrid,
  Users,
  AlertTriangle,
  AlertCircle,
  Rocket,
  FileText,
  Bug,
  ClipboardList
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeProject } = React.useContext(ProjectContext);
  const [loading, setLoading] = useState(true);
  const [prodIssues, setProdIssues] = useState([]);
  const [qaIssues, setQaIssues] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  
  const [waMetrics, setWaMetrics] = useState({
    totalWhatsAppIssues: 0,
    todaysIssues: 0,
    criticalIssues: 0,
    openIssues: 0,
    resolvedIssues: 0,
    duplicateIssuesPrevented: 0
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [waRes, prodRes, qaRes, momRes, docRes, reqRes] = await Promise.all([
          fetch('/api/v1/whatsapp/metrics').then(r => r.json()),
          fetch('/api/v1/issues').then(r => r.json()),
          fetch('/api/v1/qa-issues').then(r => r.json()),
          fetch('/api/v1/mom').then(r => r.json()),
          fetch('/api/v1/documents').then(r => r.json()),
          fetch('/api/v1/requirements').then(r => r.json())
        ]);
        
        setWaMetrics(waRes);
        setProdIssues(prodRes.data || []);
        setQaIssues(qaRes.data || []);
        setMeetings(momRes.data || []);
        setDocuments(docRes.data || []);
        setRequirements(reqRes.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  if (loading) {
    return <div style={{padding: '40px', color: '#fff'}}>Loading Dashboard...</div>;
  }

  // Calculate Metrics
  const uniqueProjects = new Set([...requirements.map(r => r.module), ...prodIssues.map(i => i.module), ...qaIssues.map(i => i.module)]);
  uniqueProjects.delete(undefined);
  const totalProjects = uniqueProjects.size || 0;

  const now = new Date();
  
  const filteredMeetings = activeProject === 'All' ? meetings : meetings.filter(m => m.project === activeProject);
  const filteredProdIssues = activeProject === 'All' ? prodIssues : prodIssues.filter(i => i.module === activeProject || i.project === activeProject);
  const filteredQaIssues = activeProject === 'All' ? qaIssues : qaIssues.filter(i => i.module === activeProject || i.project === activeProject);
  const filteredRequirements = activeProject === 'All' ? requirements : requirements.filter(r => r.module === activeProject || r.project === activeProject);

  const meetingsThisWeek = filteredMeetings.filter(m => {
    if (!m.date) return false;
    const diffTime = Math.abs(now - new Date(m.date));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
  }).length;

  const openProdIssues = filteredProdIssues.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
  
  const criticalIssuesCount = 
    filteredProdIssues.filter(i => i.priority === 'Critical').length + 
    filteredQaIssues.filter(i => i.severity === 'Critical').length;
    
  const upcomingReleasesCount = filteredRequirements.filter(r => r.status === 'In Progress' || r.status === 'Draft').length;

  // Chart Data: Status
  const allIssues = [...filteredProdIssues, ...filteredQaIssues];
  const statusCount = {};
  allIssues.forEach(i => {
    const s = i.status || 'Unknown';
    statusCount[s] = (statusCount[s] || 0) + 1;
  });
  const statusColors = { 
    'Open': '#ef4444', 'In Progress': '#f8ab37', 'Retesting': '#a855f7', 
    'Resolved': '#22c55e', 'Closed': '#3b82f6', 'Blocked': '#eab308', 
    'Future Implementation': '#6366f1', 'Rejected': '#dc2626'
  };
  const statusData = Object.keys(statusCount).map(k => ({ 
    name: k, 
    value: statusCount[k], 
    color: statusColors[k] || '#a0a3b1' 
  }));

  // Chart Data: Priority/Severity
  const priorityCount = {};
  filteredProdIssues.forEach(i => { if (i.priority) priorityCount[i.priority] = (priorityCount[i.priority] || 0) + 1; });
  filteredQaIssues.forEach(i => { if (i.severity) priorityCount[i.severity] = (priorityCount[i.severity] || 0) + 1; });
  const prioColors = { 'Critical': '#dc2626', 'High': '#ea580c', 'Medium': '#f59e0b', 'Low': '#3b82f6' };
  const priorityData = Object.keys(priorityCount).map(k => ({ 
    name: k, 
    value: priorityCount[k], 
    color: prioColors[k] || '#a0a3b1' 
  }));

  // Chart Data: Project/Module
  const projectCount = {};
  allIssues.forEach(i => {
    const m = i.module || 'Other';
    projectCount[m] = (projectCount[m] || 0) + 1;
  });
  const projectData = Object.keys(projectCount).map(k => ({ name: k, issues: projectCount[k] }));

  // Lists & Sorting Logic
  // Meetings
  const recentMeetings = [...filteredMeetings].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const pendingActions = [];
  filteredMeetings.forEach(m => {
    (m.points || []).forEach(p => {
      if (p.status === 'Open' || p.status === 'In Progress') {
        pendingActions.push({
          task: p.task, meeting: m.title, project: m.project,
          owner: p.owner, dueDate: p.targetDate, status: p.status, momId: m.id
        });
      }
    });
  });

  // Production Issues (Sort by Critical first, then by date)
  const severityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const topProdIssues = [...filteredProdIssues].sort((a, b) => {
    const wA = severityWeight[a.priority] || 0;
    const wB = severityWeight[b.priority] || 0;
    if (wA !== wB) return wB - wA; // Critical first
    return new Date(b.raisedDate) - new Date(a.raisedDate); // Then recent
  }).slice(0, 5);

  // QA Issues (Tracker)
  const topQaIssues = [...filteredQaIssues].sort((a, b) => {
    const wA = severityWeight[a.severity] || 0;
    const wB = severityWeight[b.severity] || 0;
    if (wA !== wB) return wB - wA; 
    return new Date(b.raisedDate) - new Date(a.raisedDate);
  }).slice(0, 5);

  // Requirements
  const recentRequirements = [...filteredRequirements].sort((a,b) => new Date(b.requestedDate) - new Date(a.requestedDate)).slice(0, 5);

  return (
    <div className="dashboard-container" style={{paddingBottom: '40px'}}>
      {/* Header Row */}
      <div className="dashboard-header-row">
        <div className="dashboard-title">
          <h2>Dashboard</h2>
          <p>Welcome back! Here's your project status at a glance.</p>
        </div>
        <div className="header-actions">
          <button className="header-btn">
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <LayoutGrid size={24} color="#f59e0b" />
            <div className="kpi-value">
              <h3>{totalProjects}</h3>
              <span>Total Modules</span>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <Users size={24} color="#f59e0b" />
            <div className="kpi-value">
              <h3>{meetingsThisWeek}</h3>
              <span>Meetings This Week</span>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <AlertTriangle size={24} color="#ef4444" />
            <div className="kpi-value">
              <h3>{openProdIssues}</h3>
              <span>Open Prod Issues</span>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <AlertCircle size={24} color="#ef4444" />
            <div className="kpi-value">
              <h3>{criticalIssuesCount}</h3>
              <span>Critical Issues (Total)</span>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <Rocket size={24} color="#f97316" />
            <div className="kpi-value">
              <h3>{upcomingReleasesCount}</h3>
              <span>Upcoming Req.</span>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <FileText size={24} color="#f59e0b" />
            <div className="kpi-value">
              <h3>{documents.length}</h3>
              <span>Generated Docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ENTIRE PROJECT GRAPHS */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <LayoutGrid size={20} color="#f8ab37" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Entire Project Status Graph</h3>
      </div>
      <div className="charts-row">
        <div className="chart-card">
          <h4>All Issues by Status</h4>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111216', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-card">
          <h4>All Issues by Severity</h4>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111216', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h4>Issues by Module</h4>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2c33" vertical={false} />
                <XAxis dataKey="name" stroke="#a0a3b1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a0a3b1" fontSize={10} tickLine={false} axisLine={false} width={20} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#111216', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="issues" fill="#f8ab37" barSize={32} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: MINUTES OF MEETING */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Users size={20} color="#f8ab37" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Minutes of Meeting</h3>
      </div>
      <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start'}}>
        <div className="chart-card list-card" style={{flex: '0 0 350px'}}>
          <div className="list-header">
            <h4>Recent Meetings</h4>
            <a onClick={() => navigate('/minutes')} style={{cursor: 'pointer'}}>View all</a>
          </div>
          <div className="list-content">
            {recentMeetings.length === 0 ? <p style={{color: '#a0a3b1', fontSize: '13px', padding: '10px 0'}}>No recent meetings.</p> : recentMeetings.map(m => (
              <div className="list-item" key={m.id}>
                <div className="item-icon-box"><Calendar size={16} /></div>
                <div className="item-details">
                  <h5>{m.title}</h5>
                  <span>{m.project}</span>
                </div>
                <div className="item-meta">
                  <span className="date">{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="table-container" style={{flex: 1, margin: 0}}>
          <div className="table-header">
            <h4>Pending Action Items</h4>
          </div>
          {pendingActions.length === 0 ? (
            <p style={{padding: '16px', color: '#a0a3b1', textAlign: 'center'}}>No pending action items found.</p>
          ) : (
            <table className="action-table">
              <thead>
                <tr>
                  <th>Action Item</th>
                  <th>From Meeting</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingActions.slice(0, 6).map((pa, idx) => (
                  <tr key={idx}>
                    <td>{pa.task}</td>
                    <td><a onClick={() => navigate(`/minutes/tracker/${pa.momId}`)} style={{color: '#3b82f6', cursor: 'pointer', textDecoration: 'none'}}>{pa.meeting}</a></td>
                    <td>{pa.owner || 'Unassigned'}</td>
                    <td>{pa.dueDate || 'N/A'}</td>
                    <td><span className={pa.status === 'Open' ? 'badge-open' : 'badge-progress'}>{pa.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 3: PRODUCTION ISSUES */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <AlertTriangle size={20} color="#f8ab37" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Production Issues (Critical & Recent)</h3>
      </div>
      <div className="table-container" style={{margin: 0}}>
        <table className="action-table">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Module</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date Raised</th>
            </tr>
          </thead>
          <tbody>
            {topProdIssues.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', color: '#a0a3b1'}}>No production issues found.</td></tr>
            ) : topProdIssues.map(i => (
              <tr key={i.id}>
                <td><a onClick={() => navigate(`/issues/${i.id}`)} style={{color: '#3b82f6', cursor: 'pointer', textDecoration: 'none'}}>{i.issueId}</a></td>
                <td>{i.module}</td>
                <td>{i.issueTitle}</td>
                <td><span className={i.priority === 'Critical' ? 'badge-critical' : 'badge-open'}>{i.priority}</span></td>
                <td><span style={{color: i.status === 'Resolved' ? '#22c55e' : '#f8ab37'}}>{i.status}</span></td>
                <td>{i.raisedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding: '12px 16px', textAlign: 'right'}}>
           <a onClick={() => navigate('/issues')} style={{color: '#3b82f6', cursor: 'pointer', fontSize: '13px'}}>View all Production Issues →</a>
        </div>
      </div>

      {/* SECTION 4: QA ISSUES TRACKER */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Bug size={20} color="#f8ab37" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>QA Issues Tracker (Critical & Recent)</h3>
      </div>
      <div className="table-container" style={{margin: 0}}>
        <table className="action-table">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Module</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {topQaIssues.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', color: '#a0a3b1'}}>No QA issues found.</td></tr>
            ) : topQaIssues.map(i => (
              <tr key={i.id}>
                <td style={{color: '#a0a3b1'}}>{i.issueId}</td>
                <td>{i.module}</td>
                <td>{i.issueTitle}</td>
                <td><span className={i.severity === 'Critical' ? 'badge-critical' : 'badge-open'}>{i.severity}</span></td>
                <td><span style={{color: i.status === 'Resolved' || i.status === 'Closed' ? '#22c55e' : '#f8ab37'}}>{i.status}</span></td>
                <td>{i.assignedTo || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding: '12px 16px', textAlign: 'right'}}>
           <a onClick={() => navigate('/qa-issues')} style={{color: '#3b82f6', cursor: 'pointer', fontSize: '13px'}}>View all QA Issues →</a>
        </div>
      </div>

      {/* SECTION 5: REQUIREMENTS */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <ClipboardList size={20} color="#f8ab37" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Recent Requirements</h3>
      </div>
      <div className="table-container" style={{margin: 0}}>
        <table className="action-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Module</th>
              <th>Category</th>
              <th>Status</th>
              <th>Requested Date</th>
            </tr>
          </thead>
          <tbody>
            {recentRequirements.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', color: '#a0a3b1'}}>No requirements found.</td></tr>
            ) : recentRequirements.map(r => (
              <tr key={r.id}>
                <td style={{fontWeight: 500}}>{r.title}</td>
                <td>{r.module}</td>
                <td>{r.category}</td>
                <td><span className="badge-progress" style={{background: r.status === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 171, 55, 0.1)', color: r.status === 'Completed' ? '#22c55e' : '#f8ab37'}}>{r.status}</span></td>
                <td>{r.requestedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding: '12px 16px', textAlign: 'right'}}>
           <a onClick={() => navigate('/requirements')} style={{color: '#3b82f6', cursor: 'pointer', fontSize: '13px'}}>View all Requirements →</a>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
