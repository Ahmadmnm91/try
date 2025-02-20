// Initialize MEGA
let mega = null;

// Wait for the MEGA API to load
window.addEventListener('load', function() {
    // Initialize MEGA SDK
    mega = new window.MEGA();
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showStatus('Logging in...');
    
    try {
        // Login using MEGA SDK
        await mega.auth.login(email, password);
        
        // Show files section and hide login
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('filesSection').style.display = 'block';
        
        // Load files
        loadFiles();
    } catch (error) {
        showStatus('Login failed. Please check your credentials.', 'danger');
        console.error('Login error:', error);
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await mega.auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('loginForm').reset();
    hideStatus();
});

async function loadFiles() {
    try {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '<tr><td colspan="4">Loading files...</td></tr>';

        // Get files using MEGA SDK
        const files = await mega.fs.getFiles();
        
        // Clear loading message
        filesList.innerHTML = '';
        
        if (files.length === 0) {
            filesList.innerHTML = '<tr><td colspan="4">No files found</td></tr>';
            return;
        }
        
        files.forEach(file => {
            const row = document.createElement('tr');
            row.className = 'file-row';
            
            const size = formatFileSize(file.size);
            const date = new Date(file.timestamp * 1000).toLocaleString();
            
            row.innerHTML = `
                <td>${file.name}</td>
                <td class="file-size">${size}</td>
                <td class="file-date">${date}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="downloadFile('${file.handle}', '${file.name}')">
                        Download
                    </button>
                </td>
            `;
            
            filesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        showStatus('Failed to load files. Please try again.', 'danger');
    }
}

async function downloadFile(handle, fileName) {
    try {
        showStatus('Downloading file...');
        
        // Download file using MEGA SDK
        const fileData = await mega.fs.downloadFile(handle);
        
        // Create download link
        const blob = new Blob([fileData]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        hideStatus();
    } catch (error) {
        console.error('Download error:', error);
        showStatus('Failed to download file. Please try again.', 'danger');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `alert alert-${type}`;
    statusElement.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}
