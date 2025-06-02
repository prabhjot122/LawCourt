# Installing Poppler for Windows - PDF Thumbnail Generation

## Quick Installation Guide

To enable actual PDF page thumbnails (instead of placeholders), you need to install Poppler on Windows.

### Option 1: Download Pre-built Binaries (Recommended)

1. **Download Poppler for Windows:**
   - Go to: https://github.com/oschwartz10612/poppler-windows/releases/latest
   - Download: `poppler-24.08.0_x86_64.zip` (or latest version)

2. **Extract and Install:**
   ```
   1. Extract the zip file to: C:\poppler\
   2. Add C:\poppler\bin to your Windows PATH environment variable
   3. Restart your command prompt/terminal
   ```

3. **Add to Windows PATH:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "System Variables", find and select "Path", click "Edit"
   - Click "New" and add: `C:\poppler\bin`
   - Click "OK" to save

### Option 2: Local Installation (Project-specific)

1. **Download and extract to project:**
   ```
   1. Download poppler-24.08.0_x86_64.zip
   2. Extract to: Backend/poppler/
   3. The structure should be: Backend/poppler/bin/pdftoppm.exe
   ```

2. **Create config file:**
   Create `Backend/poppler_config.py`:
   ```python
   # Poppler configuration for Windows
   import os
   
   POPPLER_PATH = os.path.join(os.path.dirname(__file__), "poppler", "bin")
   ```

### Option 3: Using Conda (If you have Anaconda/Miniconda)

```bash
conda install -c conda-forge poppler
```

## Testing the Installation

1. **Restart your Flask server** after installing poppler
2. **Upload a new research paper** through the frontend
3. **Check the thumbnail** - it should now show the actual first page of the PDF

## Troubleshooting

### If thumbnails still show placeholders:

1. **Check server logs** for poppler-related errors
2. **Verify poppler installation:**
   ```bash
   pdftoppm -h
   ```
   This should show help text if poppler is properly installed.

3. **Check file permissions** - ensure the uploads directory is writable

### Common Issues:

- **"Unable to get page count"** - Poppler not in PATH or not installed
- **"Permission denied"** - Check file/folder permissions
- **"Module not found"** - Restart Flask server after installation

## Current Fallback Behavior

Without poppler, the system generates placeholder thumbnails that simulate research paper layout with:
- Paper-like white background
- Simulated title and abstract text
- Professional academic paper appearance
- PDF indicator badge

With poppler installed, you'll get actual PDF page thumbnails showing the real content of the research papers.
