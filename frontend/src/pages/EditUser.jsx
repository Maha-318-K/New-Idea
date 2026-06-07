import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, UploadCloud, EyeOff, ChevronDown, CheckCircle } from 'lucide-react';
import './CreateUser.css'; // Re-use the same CSS

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileName, setSelectedFileName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    empId: '',
    designation: '',
    phoneCode: '+91',
    phoneNumber: '',
    projects: '',
    zohoMail: '',
    password: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch user details
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/v1/users/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          // Pre-populate form. Note: Some mock users might not have all fields.
          setFormData(prev => ({
            ...prev,
            name: data.data.name || '',
            empId: data.data.empId || '',
            designation: data.data.designation || '',
            role: data.data.role || 'User', // default if not in mock data
            status: data.data.status || 'Active',
            projects: data.data.projects || 'Evergreen Farms' // default
          }));
        } else {
          alert('User not found');
          navigate('/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

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
        // Password is optional for edit (only validate if they typed something)
        if (value && value.length < 8) error = 'Password must be at least 8 characters';
        break;
      case 'role':
        if (!value) error = 'Please select a role';
        break;
      case 'designation':
        if (!value.trim()) error = 'Designation is required';
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

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run full validation before submit
    let newErrors = {};
    Object.keys(formData).forEach(key => {
      // Skip empty password on edit
      if (key === 'password' && !formData[key]) return;
      // Skip empty fields that mock data doesn't have initially if we want, but better to enforce
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; 
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        navigate('/users');
      } else {
        console.error('Failed to update user:', data.error);
        alert('Failed to update user. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
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

  if (isLoading) {
    return <div style={{ padding: '32px', color: '#fff' }}>Loading user details...</div>;
  }

  return (
    <div className="create-user-page">
      
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span>Users & Roles</span>
        <ChevronRight size={14} className="crumb-icon" />
        <Link to="/users">Users</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">Edit User</span>
      </div>

      <div className="create-header">
        <div>
          <h2>Edit User</h2>
          <p>Update the information for this user.</p>
        </div>
        <button className="back-btn" onClick={() => navigate('/users')}>
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
                <option value="User">User</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status <span className="req">*</span></label>
            <div className="select-wrapper">
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className={errors.status ? 'input-error' : ''}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
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
            <label>Designation <span className="req">*</span></label>
            <input 
              type="text" 
              name="designation" 
              placeholder="Enter designation" 
              value={formData.designation}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.designation ? 'input-error' : ''}
              required 
            />
            {errors.designation && <span className="error-text">{errors.designation}</span>}
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
                  <p>Drag & drop a new image here</p>
                  <p>or <span className="browse-link">browse</span></p>
                  <span className="upload-hint">Accepted formats: JPG, PNG, JPEG</span>
                </>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password (Leave blank to keep current)</label>
            <div className={`password-input ${errors.password ? 'input-error' : ''}`}>
              <input 
                type="password" 
                name="password" 
                placeholder="Enter new password" 
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <EyeOff size={16} className="eye-icon" />
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate('/users')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
