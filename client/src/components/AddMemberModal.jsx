import { useState } from 'react';

export default function AddMemberModal({ existingMembers, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [relationship, setRelationship] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    if (gender) formData.append('gender', gender);
    if (dateOfBirth) formData.append('date_of_birth', dateOfBirth);
    if (phone) formData.append('phone', phone);
    if (email) formData.append('email', email);
    if (photo) formData.append('photo', photo);

    if (relationship && relatedTo) {
      const rels = [];
      if (relationship === 'child_of') {
        rels.push({ member1_id: parseInt(relatedTo), member2_id: '__NEW__', relationship_type: 'parent_child' });
      } else if (relationship === 'parent_of') {
        rels.push({ member1_id: '__NEW__', member2_id: parseInt(relatedTo), relationship_type: 'parent_child' });
      } else if (relationship === 'spouse_of') {
        rels.push({ member1_id: '__NEW__', member2_id: parseInt(relatedTo), relationship_type: 'spouse' });
      }
      formData.append('relationships_meta', JSON.stringify(rels));
    }

    try {
      await onAdd(formData, relationship, relatedTo);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Family Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="photo-upload">
              <div className="photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <div className="photo-placeholder">📷</div>
                )}
              </div>
              <label className="btn btn-outline btn-sm">
                Choose Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
              </label>
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
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
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
              </div>
            </div>
            {existingMembers.length > 0 && (
              <>
                <hr />
                <h4>Relationship (optional)</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>This person is...</label>
                    <select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                      <option value="">No relationship</option>
                      <option value="child_of">Child of</option>
                      <option value="parent_of">Parent of</option>
                      <option value="spouse_of">Spouse of</option>
                    </select>
                  </div>
                  {relationship && (
                    <div className="form-group">
                      <label>Related to...</label>
                      <select value={relatedTo} onChange={(e) => setRelatedTo(e.target.value)} required>
                        <option value="">Select person</option>
                        {existingMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
