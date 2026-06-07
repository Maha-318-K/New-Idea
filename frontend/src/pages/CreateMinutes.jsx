import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, Link as LinkIcon,
  Upload, X, GripVertical
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseMomNotes } from '../utils/momParser';
import './CreateMinutes.css';

const SortableAttendee = ({ id, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="attendee-tag">
      <div {...attributes} {...listeners} className="drag-handle">
        <GripVertical size={14} />
      </div>
      <span>{id}</span>
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(id); }} className="remove-tag">
        <X size={12} />
      </button>
    </div>
  );
};

const SortableOption = ({ user, type, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: user.id.toString() });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} className="custom-option-label" style={{...style, padding: '4px 16px', display: 'flex', alignItems: 'center'}}>
      <div {...attributes} {...listeners} className="drag-handle" style={{marginRight: '8px', cursor: 'grab', padding: '4px'}}>
        <GripVertical size={14} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', margin: 0, padding: '4px 0' }}>
        {type === 'multi' ? (
          <input type="checkbox" checked={isSelected} onChange={() => onSelect(user.name)} style={{accentColor: '#f8ab37'}} />
        ) : (
          <input type="radio" checked={isSelected} onChange={() => onSelect(user.name)} name="preparedByOption" style={{accentColor: '#f8ab37'}} />
        )}
        <span style={{color: 'var(--text-main)', fontSize: '0.85rem'}}>{user.name} {user.designation ? `- ${user.designation}` : ''}</span>
      </label>
    </div>
  );
};

const CreateMinutes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const draftId = location.state?.draftId;

  const [formData, setFormData] = useState({
    dateTime: '',
    agenda: '',
    attendees: [],
    preparedBy: '',
    notes: ''
  });

  const [usersList, setUsersList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [preparedByOpen, setPreparedByOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeError, setNewAttendeeError] = useState('');
  
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = new Date(oneWeekAgo.getTime() - oneWeekAgo.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  useEffect(() => {
    fetchUsers();
    
    if (draftId) {
      const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
      const draft = drafts.find(d => d.id === draftId);
      if (draft) {
        setFormData(draft.formData);
      }
    }
  }, [draftId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        const sorted = data.data.sort((a, b) => {
          if (a.designation === 'QA Tester' && b.designation !== 'QA Tester') return -1;
          if (b.designation === 'QA Tester' && a.designation !== 'QA Tester') return 1;
          return b.id - a.id;
        });
        setUsersList(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'dateTime':
        if (!value.trim()) error = 'Date & Time is required';
        break;
      case 'agenda':
        if (!value.trim()) error = 'Meeting Agenda is required';
        break;
      case 'attendees':
        if (!value || value.length === 0) error = 'Please select attendees';
        break;
      case 'preparedBy':
        if (!value) error = 'Please select the person who prepared this';
        break;
      case 'notes':
        if (!value.trim()) error = 'Minutes of Meeting notes are required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handlePreparedBySelect = (userName) => {
    setFormData(prev => ({ ...prev, preparedBy: userName }));
    if (errors.preparedBy) {
      setErrors(prev => ({ ...prev, preparedBy: validateField('preparedBy', userName) }));
    }
    setPreparedByOpen(false);
  };

  const handleAttendeeToggle = (userName) => {
    setFormData(prev => {
      const isSelected = prev.attendees.includes(userName);
      const newAttendees = isSelected 
        ? prev.attendees.filter(a => a !== userName)
        : [...prev.attendees, userName];
      
      if (errors.attendees) {
        setErrors(errs => ({ ...errs, attendees: validateField('attendees', newAttendees) }));
      }
      return { ...prev, attendees: newAttendees };
    });
  };

  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) {
      setNewAttendeeError('Name cannot be empty');
      return;
    }
    if (usersList.some(u => u.name.toLowerCase() === newAttendeeName.trim().toLowerCase())) {
      setNewAttendeeError('Name already exists');
      return;
    }

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAttendeeName.trim(), designation: '', empId: `EMP-${Date.now().toString().slice(-4)}` })
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        handleAttendeeToggle(data.data.name);
        setNewAttendeeName('');
        setNewAttendeeError('');
      } else {
        setNewAttendeeError(data.error || 'Failed to add');
      }
    } catch (err) {
      setNewAttendeeError('Server error');
    }
  };

  const handleDragEndSelected = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.attendees.indexOf(active.id);
        const newIndex = prev.attendees.indexOf(over.id);
        return {
          ...prev,
          attendees: arrayMove(prev.attendees, oldIndex, newIndex),
        };
      });
    }
  };

  const handleDragEndUsers = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setUsersList((prev) => {
        const oldIndex = prev.findIndex(u => u.id.toString() === active.id);
        const newIndex = prev.findIndex(u => u.id.toString() === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFileError('File size exceeds 50MB');
      return;
    }
    
    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.doc') && !file.name.endsWith('.docx') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      setFileError('Invalid file format. Only TXT, PDF, DOC, DOCX, XLS, XLSX allowed.');
      return;
    }

    setFileError('');
    setIsUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/v1/mom/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          notes: prev.notes + (prev.notes ? '\n\n' : '') + data.data 
        }));
        if (errors.notes) {
          setErrors(prev => ({ ...prev, notes: '' }));
        }
      } else {
        setFileError(data.error || 'Upload failed');
      }
    } catch (err) {
      setFileError('Server error during upload');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleBack = () => {
    const hasData = formData.dateTime || formData.agenda || formData.attendees.length > 0 || formData.preparedBy || formData.notes;
    if (hasData) {
      const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
      if (draftId) {
        const idx = drafts.findIndex(d => d.id === draftId);
        if (idx !== -1) drafts[idx].formData = formData;
      } else {
        drafts.push({
          id: Date.now().toString(),
          title: formData.agenda || 'Untitled Draft',
          date: new Date().toLocaleString(),
          formData
        });
      }
      localStorage.setItem('mom-drafts', JSON.stringify(drafts));
    }
    navigate('/minutes');
  };

  const handlePreview = (e) => {
    e.preventDefault();
    let newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setShowPreview(true);
  };

  const calculatePoints = (notes) => {
    return parseMomNotes(notes).length;
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    let date = formData.dateTime;
    let time = '10:00 AM';
    
    if (formData.dateTime && formData.dateTime.includes('T')) {
      const parts = formData.dateTime.split('T');
      date = parts[0]; 
      time = parts[1]; 
    }

    const attCount = Array.isArray(formData.attendees) ? formData.attendees.length : 1;

    const payload = {
      date: date,
      time: time,
      agendaTitle: formData.agenda,
      agendaSubtitle: 'Discussion',
      preparedBy: formData.preparedBy,
      attendeesCount: attCount,
      attendeesList: formData.attendees,
      notes: formData.notes,
      pointsCount: calculatePoints(formData.notes)
    };

    try {
      const res = await fetch('/api/v1/mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
          const filtered = drafts.filter(d => d.id !== draftId);
          localStorage.setItem('mom-drafts', JSON.stringify(filtered));
        }
        navigate('/minutes');
      } else {
        alert('Failed to save minutes.');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving meeting minutes.');
    } finally {
      setIsSubmitting(false);
      setShowPreview(false);
    }
  };

  return (
    <div className="create-mom-page">
      
      <div className="breadcrumbs">
        <span onClick={handleBack} style={{cursor: 'pointer', color: 'inherit'}}>Minutes of Meeting</span>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">{draftId ? 'Edit Draft' : 'Create'}</span>
      </div>

      <div className="create-header">
        <div>
          <h2>{draftId ? 'Edit Draft' : 'Create Minutes of Meeting'}</h2>
          <p style={{ color: '#f8ab37' }}>Fill in the details below to create a new minutes of meeting.</p>
        </div>
        <button className="back-btn new-color" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Meetings
        </button>
      </div>

      <form className="create-form-card" onSubmit={handlePreview}>
        
        <div className="form-grid">
          {/* Date & Time */}
          <div className="form-group">
            <label>Date & Time <span className="req">*</span></label>
            <div className={`input-with-icon-left ${errors.dateTime ? 'input-error' : ''}`}>
              <CalendarIcon size={16} className="input-icon-left" />
              <input 
                type="datetime-local" 
                name="dateTime" 
                value={formData.dateTime}
                onChange={handleChange}
                onBlur={handleBlur}
                min={oneWeekAgoStr}
                max={todayStr}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onKeyDown={(e) => e.preventDefault()}
                style={errors.dateTime ? {borderColor: '#ef4444', cursor: 'pointer'} : {cursor: 'pointer'}}
              />
            </div>
            {errors.dateTime && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.dateTime}</span>}
          </div>

          {/* Meeting Agenda */}
          <div className="form-group">
            <label>Meeting Agenda <span className="req">*</span></label>
            <input 
              type="text" 
              name="agenda" 
              placeholder="Enter meeting agenda (max 100 characters)" 
              value={formData.agenda}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={100}
              style={errors.agenda ? {borderColor: '#ef4444'} : {}}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
              {errors.agenda ? (
                <span className="error-text" style={{color: '#ef4444'}}>{errors.agenda}</span>
              ) : <span></span>}
              <span style={{color: formData.agenda.length === 100 ? '#ef4444' : '#a0a3b1'}}>
                {formData.agenda.length}/100
              </span>
            </div>
          </div>

          {/* Meeting Attendees */}
          <div className="form-group">
            <label>Meeting Attendees <span className="req">*</span></label>
            
            {formData.attendees.length > 0 && (
              <div className="selected-attendees-container">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSelected}>
                  <SortableContext items={formData.attendees} strategy={horizontalListSortingStrategy}>
                    <div className="tags-wrapper">
                      {formData.attendees.map(a => (
                        <SortableAttendee key={a} id={a} onRemove={handleAttendeeToggle} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            <div className="custom-multi-select-wrapper" style={{ position: 'relative' }}>
              <div 
                className="custom-select-box" 
                onClick={() => { setAttendeesOpen(!attendeesOpen); setPreparedByOpen(false); }}
                style={errors.attendees ? {borderColor: '#ef4444'} : {}}
              >
                <div className="selected-text">
                  <span style={{ color: '#a0a3b1' }}>Select or add attendees...</span>
                </div>
                <ChevronDown size={16} className="select-icon" />
              </div>
              
              {attendeesOpen && (
                <div className="custom-options-dropdown">
                  <div className="add-new-name-box">
                    <input 
                      type="text" 
                      placeholder="Add new name..." 
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button type="button" onClick={handleAddAttendee}>Add</button>
                  </div>
                  {newAttendeeError && <span className="add-name-error">{newAttendeeError}</span>}
                  <div className="dropdown-divider"></div>
                  
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndUsers}>
                    <SortableContext items={usersList.map(u => u.id.toString())} strategy={verticalListSortingStrategy}>
                      {usersList.map(u => (
                        <SortableOption 
                          key={`att-opt-${u.id}`} 
                          user={u} 
                          type="multi" 
                          isSelected={formData.attendees.includes(u.name)} 
                          onSelect={handleAttendeeToggle} 
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
            {errors.attendees ? (
              <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.attendees}</span>
            ) : (
              <span className="helper-text-orange">You can select multiple, and drag to reorder options</span>
            )}
          </div>

          {/* Prepared By */}
          <div className="form-group">
            <label style={{ whiteSpace: 'nowrap' }}>Prepared By <span className="req">*</span></label>
            <div className="custom-multi-select-wrapper" style={{ position: 'relative' }}>
              <div 
                className="custom-select-box" 
                onClick={() => { setPreparedByOpen(!preparedByOpen); setAttendeesOpen(false); }}
                style={errors.preparedBy ? {borderColor: '#ef4444'} : {}}
              >
                <div className="selected-text">
                  {formData.preparedBy ? (
                    <span>{formData.preparedBy}</span>
                  ) : (
                    <span style={{ color: '#a0a3b1' }}>Select name...</span>
                  )}
                </div>
                <ChevronDown size={16} className="select-icon" />
              </div>
              
              {preparedByOpen && (
                <div className="custom-options-dropdown">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndUsers}>
                    <SortableContext items={usersList.map(u => u.id.toString())} strategy={verticalListSortingStrategy}>
                      {usersList.map(u => (
                        <SortableOption 
                          key={`prep-opt-${u.id}`} 
                          user={u} 
                          type="single" 
                          isSelected={formData.preparedBy === u.name} 
                          onSelect={handlePreparedBySelect} 
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
            {errors.preparedBy && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.preparedBy}</span>}
          </div>
        </div>

        {/* Minutes of Meeting Notes */}
        <div className="form-group full-width">
          <label style={{ margin: 0, display: 'block', marginBottom: '4px' }}>Minutes of Meeting Notes <span className="req">*</span></label>
          <p className="sub-label text-orange" style={{color: '#f8ab37', marginBottom: '12px'}}>Copy and paste the minutes of meeting notes in the editor below, or upload a file.</p>
          
          <div className="file-upload-box" onClick={() => document.getElementById('fileUpload').click()}>
            <div className="file-upload-text">
              {isUploading ? 'Uploading...' : 'Choose a file to extract text (.txt, .pdf, .doc, .docx)...'}
            </div>
            <div className="file-upload-button">
              <Upload size={14} /> Browse
            </div>
            <input 
              id="fileUpload" 
              type="file" 
              accept=".txt,.pdf,.doc,.docx,.xls,.xlsx" 
              onChange={handleFileUpload} 
              style={{display: 'none'}} 
            />
          </div>
          {fileError && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{fileError}</span>}
          
          <div className="rich-text-editor" style={errors.notes ? {borderColor: '#ef4444'} : {}}>
            <div className="editor-toolbar">
              <div className="toolbar-dropdown">
                <span>Normal</span>
                <ChevronDown size={14} />
              </div>
              <div className="toolbar-divider"></div>
              <button type="button" className="toolbar-btn"><Bold size={16} /></button>
              <button type="button" className="toolbar-btn"><Italic size={16} /></button>
              <button type="button" className="toolbar-btn"><Underline size={16} /></button>
              <div className="toolbar-divider"></div>
              <button type="button" className="toolbar-btn"><List size={16} /></button>
              <button type="button" className="toolbar-btn"><ListOrdered size={16} /></button>
              <button type="button" className="toolbar-btn"><AlignLeft size={16} /></button>
              <div className="toolbar-divider"></div>
              <button type="button" className="toolbar-btn"><LinkIcon size={16} /></button>
            </div>
            <textarea 
              name="notes"
              placeholder="Paste or type the minutes of meeting notes here..."
              value={formData.notes}
              onChange={handleChange}
              onBlur={handleBlur}
            ></textarea>
          </div>
          {errors.notes && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.notes}</span>}
        </div>

        <div className="form-actions-left">
          <button type="submit" className="submit-btn-orange">
            Create
          </button>
          <button type="button" className="cancel-btn-dark new-color" onClick={handleBack}>Cancel</button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content glassmorphism" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview Meeting Minutes</h3>
              <button className="close-modal-btn" onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>S.No</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Page Name</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Issue</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parseMomNotes(formData.notes).map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '12px', verticalAlign: 'top', width: '60px', color: '#f8ab37' }}>{point.index}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold' }}>{point.pageName}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{point.issueText}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}><span style={{ color: '#f8ab37' }}>Open</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="cancel-btn-dark" onClick={() => setShowPreview(false)} disabled={isSubmitting}>Back</button>
              <button className="submit-btn-orange" onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Confirming...' : 'Confirm Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateMinutes;
