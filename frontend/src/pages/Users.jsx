import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Trash2, History, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  const [currentRole] = useState(loggedInUser.role || 'User');
  const [currentName] = useState(loggedInUser.name || 'You');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchActionLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v1/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionLogs = async () => {
    try {
      const response = await fetch('/api/v1/users/logs/action-history');
      const data = await response.json();
      if (data.success) {
        setActionLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterRole: currentRole,
          requesterName: currentName
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchActionLogs();
      } else {
        alert(data.error || 'Failed to delete user due to permissions.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting.');
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`/api/v1/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          requesterName: currentName
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchActionLogs();
      }
    } catch (error) {
      console.error('Status toggle error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  return (
    <div className="users-page">
      


      <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Users</h2>
          <p>Manage all system users.</p>
        </div>
        <button className="create-user-btn" onClick={() => setShowLogsModal(true)} style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}>
          <History size={16} />
          Action History
        </button>
      </div>

      <div className="users-toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ width: '350px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="searchUsers" 
              value={searchQuery}
              onChange={handleSearch}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '36px' }}
            />
          </div>
          <div className="page-select-wrapper" style={{ position: 'relative' }}>
            <select 
              className="rows-select" 
              value={roleFilter} 
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ paddingRight: '24px', appearance: 'none' }}
            >
              <option value="">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Employee">Employee</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0a3b1' }} />
          </div>
        </div>
        <button className="create-user-btn" onClick={() => navigate('/users/create')}>
          <Plus size={16} />
          Create User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Emp ID</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Designation</th>
              <th>Status</th>
              <th className="action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading users...</td></tr>
            ) : currentUsers.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              currentUsers.map((user, idx) => (
                <tr key={user.id}>
                  <td>{indexOfFirstUser + idx + 1}</td>
                  <td>
                    <div className="user-name-cell">
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="emp-id-text">{user.empId}</td>
                  <td>{user.phoneNumber ? `${user.phoneCode || '+91'} ${user.phoneNumber}` : 'N/A'}</td>
                  <td><span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{user.role || 'Employee'}</span></td>
                  <td className="designation-text">{user.designation}</td>
                  <td>
                    <div 
                      className={`status-pill ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleUserStatus(user)}
                      style={{ cursor: 'pointer', display: 'inline-block', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${user.status === 'Active' ? '#10b981' : '#ef4444'}`, color: user.status === 'Active' ? '#10b981' : '#ef4444', backgroundColor: user.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                      title="Click to toggle status"
                    >
                      {user.status || 'Active'}
                    </div>
                  </td>
                  <td className="action-col">
                    <div className="action-buttons">
                      {(currentRole === 'Admin' || currentRole === 'Super Admin') && (
                        <button className="action-btn" onClick={() => navigate(`/users/edit/${user.id}`)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button className="action-btn" onClick={() => navigate(`/users/${user.id}`)} title="View">
                        <ArrowRight size={16} />
                      </button>
                      <button className="action-btn" onClick={() => setShowLogsModal(true)} title="Action History">
                        <History size={16} />
                      </button>
                      {(currentRole === 'Admin' || currentRole === 'Super Admin') && (
                        <button className="action-btn" onClick={() => handleDelete(user.id)} title="Delete" style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="users-footer">
        <div className="rows-per-page">
          <span>Rows per page:</span>
          <div className="page-select-wrapper">
            <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="rows-select">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <span className="showing-text">
            Showing {filteredUsers.length === 0 ? 0 : indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
        </div>
        
        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i + 1} 
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Action Logs Modal */}
      {showLogsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111216', width: '600px', maxHeight: '80vh', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Action History</h3>
              <button onClick={() => setShowLogsModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {actionLogs.length === 0 ? (
                <p style={{ color: '#a0a3b1', textAlign: 'center' }}>No actions recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {actionLogs.map(log => (
                    <div key={log.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#f8ab37' }}>{log.what}</span>
                        <span style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{log.why}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#a0a3b1' }}>Performed by: {log.who}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
