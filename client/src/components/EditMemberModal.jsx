import { useState } from 'react';

export default function EditMemberModal({ member, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState(member.name);
  const [gender, setGender] = useState(member.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(member.date_of_birth || '');
  const [dateOfDeath, setDateOfDeath] = useState(member.date_of_death || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [email, setEmail] = useState(member.email || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(member.photo_url);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('date_of_birth', dateOfBirth);
    formData.append('date_of_death', dateOfDeath);
    formData.append('phone', phone);
    formData.append('email', email);
    if (photo) formData.append('photo', photo);
    if (removePhoto) formData.append('remove_photo', 'true');

    try {
      await onUpdate(member.id, formData);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${member.name} from the tree? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await onDelete(member.id);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="photo-upload">
              <div className="photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <div className="photo-placeholder">
                    {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="photo-actions">
                <label className="btn btn-outline btn-sm">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                </label>
                {(photoPreview || member.photo_url) && (
                  <button type="button" className="btn btn-outline btn-sm btn-danger" onClick={handleRemovePhoto}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Date of Death</label>
              <input type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>Delete</button>
            <div>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginLeft: 8 }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
