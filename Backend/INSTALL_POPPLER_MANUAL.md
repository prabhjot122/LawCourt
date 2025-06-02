# Manual Poppler Installation for Windows

## Quick Fix for PDF Thumbnails

Your research paper cards are currently showing placeholders instead of actual PDF content because poppler is not installed. Here's how to fix it:

### Step 1: Download Poppler
1. Go to: https://github.com/oschwartz10612/poppler-windows/releases/latest
2. Download: `poppler-24.08.0_x86_64.zip` (for 64-bit Windows)

### Step 2: Extract and Install
1. Extract the downloaded zip file
2. Copy the extracted folder to: `C:\poppler\`
3. The structure should look like: `C:\poppler\bin\pdftoppm.exe`

### Step 3: Add to Windows PATH
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables" button
3. Under "System Variables", find and select "Path", click "Edit"
4. Click "New" and add: `C:\poppler\bin`
5. Click "OK" to save all dialogs

### Step 4: Restart Flask Server
1. Stop your current Flask server (Ctrl+C in the terminal)
2. Start it again: `python app.py`

### Step 5: Test
1. Upload a new research paper through your frontend
2. The thumbnail should now show the actual first page of the PDF!

## Alternative: Project-Local Installation

If you don't want to modify system PATH:

1. Extract poppler to: `Backend\poppler\`
2. Create file `Backend\poppler_config.py` with this content:
```python
import os
POPPLER_PATH = os.path.join(os.path.dirname(__file__), "poppler", "bin")
```
3. Restart Flask server

## Verification

After installation, you should see in your Flask server logs:
- Instead of: `pdf2image failed: Unable to get page count. Is poppler installed and in PATH?`
- You should see: `Thumbnail generated successfully using pdf2image`

## Troubleshooting

### If it still doesn't work:
1. Open Command Prompt and type: `pdftoppm -h`
   - If you see help text, poppler is installed correctly
   - If you see "command not found", PATH is not set correctly

2. Check Flask server logs for error messages

3. Make sure you restarted the Flask server after installation

### Common Issues:
- **Forgot to restart Flask server** - This is the most common issue!
- **PATH not set correctly** - Make sure `C:\poppler\bin` is in your system PATH
- **Wrong architecture** - Make sure you downloaded the x86_64 version for 64-bit Windows

## Expected Result

After successful installation:
- New research paper uploads will show actual PDF page thumbnails
- Existing research papers will still show placeholders (they need to be re-uploaded)
- The thumbnails will look like the reference image you showed me

## Quick Test

To test if poppler is working, try this in Command Prompt:
```cmd
pdftoppm -h
```

If you see help text, poppler is installed correctly!
