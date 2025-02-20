// Constants
const API_GATEWAY = 'https://g.api.mega.co.nz';
let sessionId = null;
let userKey = null;

// Helper function to show status messages
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `alert alert-${type}`;
    statusElement.style.display = 'block';
}

// Helper function to hide status messages
function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

// Generate random bytes for encryption
function generateRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

// Prepare password key
function prepareKey(password) {
    const passwordBytes = new TextEncoder().encode(password);
    return CryptoJS.SHA256(passwordBytes);
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        showStatus('Logging in...');
        const passwordKey = prepareKey(password);
        const emailBytes = new TextEncoder().encode(email.toLowerCase());
        const emailHash = CryptoJS.SHA256(emailBytes);

        const response = await fetch(`${API_GATEWAY}/cs`, {
            method: 'POST',
            body: JSON.stringify([{
                a: 'us',
                user: email,
                uh: emailHash.toString()
            }])
        });

        const data = await response.json();
        
        if (data[0] === -9) {
            showStatus('Invalid email or password', 'danger');
            return;
        }

        sessionId = data[0].csid;
        
        // Show files section after successful login
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('filesSection').style.display = 'block';
        
        // Load files
        loadFiles();
        hideStatus();

    } catch (error) {
        console.error('Login error:', error);
        showStatus('Login failed. Please try again.', 'danger');
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionId = null;
    userKey = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('loginForm').reset();
    hideStatus();
});

// Load files function
async function loadFiles() {
    try {
        if (!sessionId) {
            showStatus('Please login first', 'warning');
            return;
        }

        const response = await fetch(`${API_GATEWAY}/cs`, {
            method: 'POST',
            body: JSON.stringify([{
                a: 'f',
                c: 1,
                r: 1,
                sid: sessionId
            }])
        });

        const data = await response.json();
        
        if (data.length === 0 || !data[0].f) {
            document.getElementById('filesList').innerHTML = 
                '<tr><td colspan="3" class="text-center">No files found</td></tr>';
            return;
        }

        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';

        data[0].f.forEach(file => {
            if (file.t === 0) { // Only show files, not folders
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${file.n}</td>
                    <td>${formatFileSize(file.s)}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" 
                                onclick="downloadFile('${file.h}')">Download</button>
                        <button class="btn btn-danger btn-sm ms-2" 
                                onclick="deleteFile('${file.h}')">Delete</button>
                    </td>
                `;
                filesList.appendChild(row);
            }
        });

    } catch (error) {
        console.error('Error loading files:', error);
        showStatus('Failed to load files', 'danger');
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File upload handler
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showStatus('Uploading file...');
        
        // Get upload URL
        const response = await fetch(`${API_GATEWAY}/cs`, {
            method: 'POST',
            body: JSON.stringify([{
                a: 'u',
                ssl: 0,
                sid: sessionId
            }])
        });

        const uploadData = await response.json();
        
        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        await fetch(uploadData[0].p, {
            method: 'POST',
            body: formData
        });

        showStatus('File uploaded successfully!', 'success');
        loadFiles();

    } catch (error) {
        console.error('Upload error:', error);
        showStatus('Failed to upload file', 'danger');
    }
}

// Download file
async function downloadFile(fileHandle) {
    try {
        showStatus('Preparing download...');

        const response = await fetch(`${API_GATEWAY}/cs`, {
            method: 'POST',
            body: JSON.stringify([{
                a: 'g',
                g: 1,
                p: fileHandle,
                sid: sessionId
            }])
        });

        const data = await response.json();
        
        if (data[0].g) {
            window.location.href = data[0].g;
        }

        hideStatus();

    } catch (error) {
        console.error('Download error:', error);
        showStatus('Failed to download file', 'danger');
    }
}

// Delete file
async function deleteFile(fileHandle) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
        showStatus('Deleting file...');

        const response = await fetch(`${API_GATEWAY}/cs`, {
            method: 'POST',
            body: JSON.stringify([{
                a: 'd',
                n: fileHandle,
                sid: sessionId
            }])
        });

        await response.json();
        showStatus('File deleted successfully!', 'success');
        loadFiles();

    } catch (error) {
        console.error('Delete error:', error);
        showStatus('Failed to delete file', 'danger');
    }
}
