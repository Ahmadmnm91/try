// Initialize MEGA instance
let mega = null;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Create a new MEGA instance
        mega = new Mega();
        await mega.login(email, password);
        
        // Show files section and hide login
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('filesSection').style.display = 'block';
        
        // Load files
        loadFiles();
    } catch (error) {
        alert('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    mega = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('loginForm').reset();
});

async function loadFiles() {
    try {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '<tr><td colspan="4">Loading files...</td></tr>';

        // Get files from MEGA
        const files = await mega.getFiles();
        
        // Clear loading message
        filesList.innerHTML = '';
        
        files.forEach(file => {
            const row = document.createElement('tr');
            row.className = 'file-row';
            
            // Format file size
            const size = formatFileSize(file.size);
            
            // Format date
            const date = new Date(file.timestamp * 1000).toLocaleString();
            
            row.innerHTML = `
                <td>${file.name}</td>
                <td class="file-size">${size}</td>
                <td class="file-date">${date}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="downloadFile('${file.id}', '${file.name}')">
                        Download
                    </button>
                </td>
            `;
            
            filesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        alert('Failed to load files. Please try again.');
    }
}

async function downloadFile(fileId, fileName) {
    try {
        const file = await mega.downloadFile(fileId);
        
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([file]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download file. Please try again.');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}