// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    const session = await requireAuth();
    if (!session) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        // Sidebar
        document.getElementById('sidebarName').textContent = profile.full_name;
        document.getElementById('sidebarDept').textContent = `${profile.department} · ${profile.level}`;
        document.getElementById('sidebarAvatar').textContent = initials;

        // Settings header
        document.getElementById('settingsAvatar').textContent = initials;
        document.getElementById('settingsName').textContent = profile.full_name;
        document.getElementById('settingsEmail').textContent = session.user.email;

        // Form fields
        document.getElementById('editName').value = profile.full_name;
        document.getElementById('editUniversity').value = profile.university;
        document.getElementById('editFaculty').value = profile.faculty;
        document.getElementById('editDepartment').value = profile.department;
        document.getElementById('editLevel').value = profile.level;
    }

    // Dark mode toggle
    const isDark = localStorage.getItem('deeex-dark') === 'true';
    document.getElementById('darkModeToggle').checked = isDark;
    if (isDark) document.body.classList.add('dark-mode');
});

// ============================
// SAVE PROFILE
// ============================
async function saveProfile() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const msg = document.getElementById('profileMsg');

    const updates = {
        full_name: document.getElementById('editName').value.trim(),
        university: document.getElementById('editUniversity').value.trim(),
        faculty: document.getElementById('editFaculty').value.trim(),
        department: document.getElementById('editDepartment').value.trim(),
        level: document.getElementById('editLevel').value,
    };

    if (!updates.full_name || !updates.university || !updates.department) {
        msg.textContent = 'Please fill in all required fields.';
        msg.className = 'settings-msg error';
        return;
    }

    const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

    if (error) {
        msg.textContent = 'Error: ' + error.message;
        msg.className = 'settings-msg error';
        return;
    }

    msg.textContent = '✓ Profile updated successfully!';
    msg.className = 'settings-msg success';

    // Update sidebar + header
    const initials = updates.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('sidebarName').textContent = updates.full_name;
    document.getElementById('sidebarDept').textContent = `${updates.department} · ${updates.level}`;
    document.getElementById('sidebarAvatar').textContent = initials;
    document.getElementById('settingsAvatar').textContent = initials;
    document.getElementById('settingsName').textContent = updates.full_name;
}

// ============================
// CHANGE PASSWORD
// ============================
async function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmNew = document.getElementById('confirmNewPassword').value;
    const msg = document.getElementById('passwordMsg');

    if (!newPassword || !confirmNew) {
        msg.textContent = 'Please fill in both fields.';
        msg.className = 'settings-msg error';
        return;
    }

    if (newPassword !== confirmNew) {
        msg.textContent = 'Passwords do not match.';
        msg.className = 'settings-msg error';
        return;
    }

    if (newPassword.length < 6) {
        msg.textContent = 'Password must be at least 6 characters.';
        msg.className = 'settings-msg error';
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
        msg.textContent = 'Error: ' + error.message;
        msg.className = 'settings-msg error';
        return;
    }

    msg.textContent = '✓ Password updated!';
    msg.className = 'settings-msg success';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

// ============================
// DARK MODE
// ============================
function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('deeex-dark', isDark);
}