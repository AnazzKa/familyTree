export default function MemberCard({ member, onClick }) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const genderColor = member.gender === 'male' ? 'var(--color-male)' :
                       member.gender === 'female' ? 'var(--color-female)' :
                       'var(--color-other)';

  const age = member.date_of_birth ? calculateAge(member.date_of_birth, member.date_of_death) : null;

  return (
    <div className="member-card" onClick={onClick} style={{ borderTopColor: genderColor }}>
      <div className="member-avatar">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} />
        ) : (
          <div className="member-initials" style={{ backgroundColor: genderColor }}>
            {initials}
          </div>
        )}
      </div>
      <div className="member-name">{member.name}</div>
      {age !== null && <div className="member-age">{member.date_of_death ? `${age} yrs (deceased)` : `${age} yrs`}</div>}
      {member.linked_user_id && <div className="member-linked" title="Has an account">✓</div>}
    </div>
  );
}

function calculateAge(dob, dod) {
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}
