import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, UploadCloud, EyeOff, ChevronDown, CheckCircle } from 'lucide-react';
import './CreateUser.css';

const CreateUser = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [customRole, setCustomRole] = useState('');
  
  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    empId: '',
    designation: '',
    phoneCode: '+91',
    phoneNumber: '',
    projects: '',
    zohoMail: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Full Name is required';
        else if (!/^[a-zA-Z\s]*$/.test(value)) error = 'Name can only contain letters and spaces';
        break;
      case 'empId':
        if (!value.trim()) error = 'Employee ID is required';
        else if (!/^EMP[0-9]+$/.test(value)) error = 'Must start with EMP followed by numbers';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d{10}$/.test(value)) error = 'Must be exactly 10 digits';
        break;
      case 'zohoMail':
        if (!value.trim()) error = 'Zoho Mail is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        else if (!value.endsWith('zohomail.com') && !value.endsWith('zoho.com')) error = 'Must be a Zoho email address';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(value)) error = 'Must contain at least one uppercase letter';
        else if (!/[a-z]/.test(value)) error = 'Must contain at least one lowercase letter';
        else if (!/[0-9]/.test(value)) error = 'Must contain at least one number';
        else if (!/[^A-Za-z0-9]/.test(value)) error = 'Must contain at least one special character';
        break;
      case 'role':
        if (!value) error = 'Please select a role';
        else if (value === 'Add Role...' && !customRole.trim()) error = 'Custom role is required';
        break;
      case 'projects':
        if (!value) error = 'Please select a project';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'empId') {
      let val = value.toUpperCase();
      if (val.startsWith('EMP')) {
        val = val.substring(3);
      } else {
        val = val.replace(/^EMP|^EM|^E/, '');
      }
      const numericVal = val.replace(/\D/g, '');
      const formattedVal = numericVal ? 'EMP' + numericVal : 'EMP';
      
      setFormData(prev => ({ ...prev, [name]: formattedVal }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, formattedVal) }));
      }
      return;
    }
    
    if (name === 'phoneNumber') {
      const numericVal = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericVal }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, numericVal) }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error as they type, or revalidate immediately
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run full validation before submit
    let newErrors = {};
    Object.keys(formData).forEach(key => {
      // Skip designation validation since it's no longer mandatory
      if (key !== 'designation') {
        const err = validateField(key, formData[key]);
        if (err) newErrors[key] = err;
      }
    });
    
    if (formData.role === 'Add Role...' && !customRole.trim()) {
      newErrors.role = 'Custom role is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop submission
    }

    setIsSubmitting(true);
    
    try {
      // Provide current user details
      const payload = {
        ...formData,
        role: formData.role === 'Add Role...' ? customRole : formData.role,
        requestedBy: loggedInUser.name || 'System',
        requesterRole: loggedInUser.role || 'Admin'
      };

      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect back to list
        navigate('/users');
      } else {
        console.error('Failed to create user:', data.error);
        alert('Failed to create user. Please try again.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    }
  };

  const generateAIAssistant = () => {
    if (!formData.role) {
      alert("Please select a Role first for AI to generate a Designation.");
      return;
    }
    const designations = {
      'Super Admin': ['Chief Executive Officer', 'Chief Technology Officer', 'System Architect'],
      'Admin': ['Project Manager', 'Lead Developer', 'Operations Head'],
      'User': ['Software Engineer', 'QA Tester', 'Business Analyst', 'UI/UX Designer']
    };
    
    const options = designations[formData.role];
    const randomDesig = options[Math.floor(Math.random() * options.length)];
    
    setFormData(prev => ({ ...prev, designation: randomDesig }));
    if (errors.designation) {
      setErrors(prev => ({ ...prev, designation: '' }));
    }
  };

  return (
    <div className="create-user-page">
      
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/users">Users & Roles</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <Link to="/users">Users</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">Create User</span>
      </div>

      <div className="create-header">
        <div>
          <h2>Create User</h2>
          <p style={{ color: '#f8ab37' }}>Add a new user and manage their access to the system.</p>
        </div>
        <button 
          onClick={() => navigate('/users')}
          style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
      </div>

      <form className="create-form-card" onSubmit={handleSubmit}>
        <h3>User Information</h3>

        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name <span className="req">*</span></label>
            <input 
              type="text" 
              name="name" 
              placeholder="Enter full name" 
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name ? 'input-error' : ''}
              required 
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label>Role <span className="req">*</span></label>
            <div className="select-wrapper">
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={errors.role ? 'input-error' : ''}
                required
              >
                <option value="" disabled>Select role</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
                <option value="Add Role...">Add Role...</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
            {formData.role === 'Add Role...' && (
              <input 
                type="text" 
                placeholder="Enter custom role" 
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                }}
                style={{ marginTop: '8px' }}
              />
            )}
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          {/* Employee ID */}
          <div className="form-group">
            <label>Employee ID <span className="req">*</span></label>
            <input 
              type="text" 
              name="empId" 
              placeholder="Enter employee ID" 
              value={formData.empId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.empId ? 'input-error' : ''}
              required 
            />
            {errors.empId && <span className="error-text">{errors.empId}</span>}
          </div>

          {/* Designation */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ margin: 0 }}>Designation</label>
              <button 
                type="button" 
                onClick={generateAIAssistant}
                style={{ background: 'transparent', border: '1px solid #f8ab37', color: '#f8ab37', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✨ AI Auto-fill
              </button>
            </div>
            <input 
              type="text" 
              name="designation" 
              placeholder="Enter designation" 
              value={formData.designation}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label>Phone Number <span className="req">*</span></label>
            <div className={`phone-input-group ${errors.phoneNumber ? 'input-error' : ''}`}>
              <div className="country-code">
                <select name="phoneCode" value={formData.phoneCode} onChange={handleChange}>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <ChevronDown size={14} className="code-icon" />
              </div>
              <input 
                type="text" 
                name="phoneNumber" 
                placeholder="Enter phone number" 
                value={formData.phoneNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                required 
              />
            </div>
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>

          {/* Projects Working On */}
          <div className="form-group">
            <label>Projects Working On <span className="req">*</span></label>
            <div className="select-wrapper">
              <select 
                name="projects" 
                value={formData.projects} 
                onChange={handleChange} 
                onBlur={handleBlur}
                className={errors.projects ? 'input-error' : ''}
                required
              >
                <option value="" disabled>Select projects</option>
                <option value="Evergreen Farms">Evergreen Farms</option>
                <option value="POS System">POS System</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
            {errors.projects ? (
              <span className="error-text">{errors.projects}</span>
            ) : (
              <span className="helper-text">You can select multiple projects</span>
            )}
          </div>

          {/* Zoho Mail */}
          <div className="form-group">
            <label>Zoho Mail <span className="req">*</span></label>
            <input 
              type="email" 
              name="zohoMail" 
              placeholder="Enter zoho mail address" 
              value={formData.zohoMail}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.zohoMail ? 'input-error' : ''}
              required 
            />
            {errors.zohoMail && <span className="error-text">{errors.zohoMail}</span>}
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label>Photo (Max 10MB)</label>
            <div className="upload-box" onClick={handleBrowseClick}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              {selectedFileName ? (
                <>
                  <CheckCircle size={24} className="upload-icon" style={{ color: '#10b981' }} />
                  <p style={{ color: '#10b981' }}>{selectedFileName}</p>
                  <span className="upload-hint">Click to change</span>
                </>
              ) : (
                <>
                  <UploadCloud size={24} className="upload-icon" />
                  <p>Drag & drop an image here</p>
                  <p>or <span className="browse-link">browse</span></p>
                  <span className="upload-hint">Accepted formats: JPG, PNG, JPEG</span>
                </>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password <span className="req">*</span></label>
            <div className={`password-input ${errors.password ? 'input-error' : ''}`}>
              <input 
                type="password" 
                name="password" 
                placeholder="Enter password" 
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required 
              />
              <EyeOff size={16} className="eye-icon" />
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/users')}
            style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '12px 24px', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
