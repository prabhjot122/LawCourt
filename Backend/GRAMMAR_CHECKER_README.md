# Grammar Checker Setup Guide

This guide explains how to set up and use the LanguageTool-based grammar checker for the LawFort MinimalBlogWriter.

## Prerequisites

- Python 3.7 or higher
- pip package manager
- Internet connection (for initial LanguageTool download)

## Installation

### Option 1: Automatic Installation

Run the installation script:

```bash
cd Backend
python install_dependencies.py
```

### Option 2: Manual Installation

Install the required packages manually:

```bash
pip install language-tool-python==2.7.1
pip install Flask==2.3.3
pip install Flask-CORS==4.0.0
# ... other dependencies from requirements.txt
```

### Option 3: Using requirements.txt

```bash
cd Backend
pip install -r requirements.txt
```

## Testing the Grammar Checker

### Run the Test Suite

```bash
cd Backend
python test_grammar_checker.py
```

This will test:
- Basic grammar checking functionality
- API function integration
- Edge cases and error handling

### Manual Testing

You can also test the grammar checker manually:

```python
from grammar_checker import GrammarChecker

checker = GrammarChecker()
issues = checker.check_text("This are a test sentence with grammar error.")
print(f"Found {len(issues)} issues")

for issue in issues:
    print(f"- {issue.message}")
    print(f"  Suggestions: {issue.replacements}")

checker.close()
```

## Usage in Flask Application

The grammar checker is integrated into the Flask app with these endpoints:

### Check Grammar
```
POST /api/grammar/check
Content-Type: application/json

{
  "text": "Your text to check for grammar issues."
}
```

### Apply Suggestion
```
POST /api/grammar/apply-suggestion
Content-Type: application/json

{
  "text": "Original text",
  "offset": 0,
  "length": 4,
  "replacement": "corrected text"
}
```

### Health Check
```
GET /api/grammar/health
```

## Frontend Integration

The grammar checker is integrated into the MinimalBlogWriter component:

1. **Enable Grammar Check**: Click the "G" button in the editor header
2. **View Issues**: Grammar issues appear in a side panel
3. **Apply Fixes**: Click suggestion buttons to apply corrections
4. **Auto-checking**: Grammar is checked automatically as you type (with 2-second delay)

## Configuration

### Language Settings

By default, the grammar checker uses English (US). To change the language:

```python
# In grammar_checker.py
checker = GrammarChecker(language='en-GB')  # British English
# or
checker = GrammarChecker(language='de-DE')  # German
```

### Performance Tuning

For better performance with large texts:

1. **Increase timeout**: Modify the LanguageTool timeout settings
2. **Limit text length**: Add text length limits in the API
3. **Batch processing**: Process text in smaller chunks

## Troubleshooting

### Common Issues

1. **"Match object has no attribute 'shortMessage'"**
   - This is fixed in the current implementation
   - The code now safely handles missing attributes

2. **LanguageTool download fails**
   - Ensure internet connection
   - Try running: `python -c "import language_tool_python; language_tool_python.LanguageTool('en-US')"`

3. **Memory issues with large texts**
   - Limit text length to 10,000 characters
   - Process text in smaller chunks

4. **Slow performance**
   - LanguageTool initialization takes time on first use
   - Consider keeping the checker instance alive
   - Use caching for repeated checks

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Error Logs

Check the Flask console for grammar checker errors:
- Grammar check requests and responses
- LanguageTool initialization status
- Processing errors and warnings

## Features

### Issue Types

The grammar checker categorizes issues into:

- **Grammar**: Subject-verb agreement, tense consistency
- **Spelling**: Misspelled words
- **Punctuation**: Comma splices, missing periods
- **Style**: Wordiness, redundancy
- **Typography**: Spacing, formatting

### Suggestions

- Up to 5 suggestions per issue
- Context-aware corrections
- One-click application

### Statistics

- Total issue count
- Issues by type
- Severity distribution

## Performance Notes

- **First run**: LanguageTool downloads language models (~100MB for English)
- **Subsequent runs**: Much faster as models are cached
- **Memory usage**: ~200-500MB depending on language models
- **Processing speed**: ~1-2 seconds for typical blog posts

## Support

For issues or questions:

1. Check the test suite output
2. Review Flask console logs
3. Verify LanguageTool installation
4. Check network connectivity for initial setup
