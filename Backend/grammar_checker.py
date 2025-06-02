"""
Grammar Checker Service using LanguageTool
Provides grammar checking functionality for the MinimalBlogWriter
"""

import language_tool_python
from typing import List, Dict, Any, Optional
import json
import logging
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IssueType(Enum):
    GRAMMAR = "grammar"
    SPELLING = "spelling"
    STYLE = "style"
    PUNCTUATION = "punctuation"
    TYPOGRAPHY = "typography"

@dataclass
class GrammarIssue:
    """Represents a grammar/style issue found in text"""
    offset: int
    length: int
    message: str
    short_message: str
    issue_type: str
    rule_id: str
    replacements: List[str]
    context: str
    sentence: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'offset': self.offset,
            'length': self.length,
            'message': self.message,
            'short_message': self.short_message,
            'issue_type': self.issue_type,
            'rule_id': self.rule_id,
            'replacements': self.replacements,
            'context': self.context,
            'sentence': self.sentence
        }

class GrammarChecker:
    """Grammar checker service using LanguageTool"""
    
    def __init__(self, language: str = 'en-US'):
        """
        Initialize the grammar checker
        
        Args:
            language: Language code for LanguageTool (default: en-US)
        """
        self.language = language
        self._tool = None
        self._initialize_tool()
    
    def _initialize_tool(self):
        """Initialize LanguageTool instance"""
        try:
            self._tool = language_tool_python.LanguageTool(self.language)
            logger.info(f"LanguageTool initialized for language: {self.language}")
        except Exception as e:
            logger.error(f"Failed to initialize LanguageTool: {e}")
            raise
    
    def check_text(self, text: str) -> List[GrammarIssue]:
        """
        Check text for grammar, spelling, and style issues
        
        Args:
            text: Text to check
            
        Returns:
            List of GrammarIssue objects
        """
        if not text or not text.strip():
            return []
        
        try:
            matches = self._tool.check(text)
            issues = []

            for match in matches:
                try:
                    issue_type = self._categorize_issue(match)

                    # Get short message - LanguageTool doesn't have shortMessage attribute
                    short_msg = getattr(match, 'shortMessage', None) or match.message
                    if len(short_msg) > 100:
                        short_msg = short_msg[:97] + "..."

                    # Safely get all match attributes
                    offset = getattr(match, 'offset', 0)
                    length = getattr(match, 'errorLength', 0)
                    message = getattr(match, 'message', 'Grammar issue detected')
                    rule_id = getattr(match, 'ruleId', 'UNKNOWN')
                    replacements = getattr(match, 'replacements', [])[:5]
                    context = getattr(match, 'context', '')
                    sentence = getattr(match, 'sentence', '')

                    issue = GrammarIssue(
                        offset=offset,
                        length=length,
                        message=message,
                        short_message=short_msg,
                        issue_type=issue_type.value,
                        rule_id=rule_id,
                        replacements=replacements,
                        context=context,
                        sentence=sentence
                    )
                    issues.append(issue)

                except Exception as match_error:
                    logger.warning(f"Error processing match: {match_error}")
                    continue

            return issues

        except Exception as e:
            logger.error(f"Error checking text: {e}")
            return []
    
    def _categorize_issue(self, match) -> IssueType:
        """
        Categorize the type of issue based on LanguageTool match

        Args:
            match: LanguageTool match object

        Returns:
            IssueType enum value
        """
        rule_id = match.ruleId.lower() if match.ruleId else ""

        # Get category safely - LanguageTool match objects may not have category attribute
        category = ""
        if hasattr(match, 'category') and match.category:
            category = match.category.lower()

        # Categorize based on rule ID and category
        if 'spell' in rule_id or 'morfologik' in rule_id or 'hunspell' in rule_id:
            return IssueType.SPELLING
        elif any(word in rule_id for word in ['punct', 'comma', 'apostrophe', 'quotation']):
            return IssueType.PUNCTUATION
        elif any(word in rule_id for word in ['style', 'redundant', 'wordy', 'colloquial']):
            return IssueType.STYLE
        elif 'typography' in rule_id or 'whitespace' in rule_id or 'spacing' in rule_id:
            return IssueType.TYPOGRAPHY
        elif 'grammar' in category or 'misc' in category:
            return IssueType.GRAMMAR
        else:
            return IssueType.GRAMMAR
    
    def get_statistics(self, issues: List[GrammarIssue]) -> Dict[str, Any]:
        """
        Get statistics about the issues found
        
        Args:
            issues: List of GrammarIssue objects
            
        Returns:
            Dictionary with statistics
        """
        if not issues:
            return {
                'total_issues': 0,
                'by_type': {},
                'severity_distribution': {}
            }
        
        # Count issues by type
        type_counts = {}
        for issue in issues:
            type_counts[issue.issue_type] = type_counts.get(issue.issue_type, 0) + 1
        
        # Simple severity classification
        severity_counts = {'high': 0, 'medium': 0, 'low': 0}
        for issue in issues:
            if issue.issue_type in ['grammar', 'spelling']:
                severity_counts['high'] += 1
            elif issue.issue_type in ['punctuation']:
                severity_counts['medium'] += 1
            else:
                severity_counts['low'] += 1
        
        return {
            'total_issues': len(issues),
            'by_type': type_counts,
            'severity_distribution': severity_counts
        }
    
    def apply_suggestion(self, text: str, issue: GrammarIssue, suggestion_index: int = 0) -> str:
        """
        Apply a suggestion to fix an issue in the text
        
        Args:
            text: Original text
            issue: GrammarIssue object
            suggestion_index: Index of the suggestion to apply (default: 0)
            
        Returns:
            Text with the suggestion applied
        """
        if not issue.replacements or suggestion_index >= len(issue.replacements):
            return text
        
        replacement = issue.replacements[suggestion_index]
        start = issue.offset
        end = issue.offset + issue.length
        
        return text[:start] + replacement + text[end:]
    
    def close(self):
        """Close the LanguageTool instance"""
        if self._tool:
            self._tool.close()
            logger.info("LanguageTool instance closed")

# Global grammar checker instance
_grammar_checker = None

def get_grammar_checker() -> GrammarChecker:
    """Get or create global grammar checker instance"""
    global _grammar_checker
    if _grammar_checker is None:
        _grammar_checker = GrammarChecker()
    return _grammar_checker

def check_grammar_api(text: str) -> Dict[str, Any]:
    """
    API function for grammar checking
    
    Args:
        text: Text to check
        
    Returns:
        Dictionary with issues and statistics
    """
    try:
        checker = get_grammar_checker()
        issues = checker.check_text(text)
        statistics = checker.get_statistics(issues)
        
        return {
            'success': True,
            'issues': [issue.to_dict() for issue in issues],
            'statistics': statistics,
            'text_length': len(text),
            'word_count': len(text.split()) if text else 0
        }
    
    except Exception as e:
        logger.error(f"Grammar check API error: {e}")
        return {
            'success': False,
            'error': str(e),
            'issues': [],
            'statistics': {'total_issues': 0, 'by_type': {}, 'severity_distribution': {}}
        }

if __name__ == "__main__":
    # Test the grammar checker
    test_text = "This are a test sentence with some grammar errors. I has been working on this project."
    
    checker = GrammarChecker()
    issues = checker.check_text(test_text)
    
    print(f"Found {len(issues)} issues:")
    for issue in issues:
        print(f"- {issue.message} (Type: {issue.issue_type})")
        if issue.replacements:
            print(f"  Suggestions: {', '.join(issue.replacements[:3])}")
    
    stats = checker.get_statistics(issues)
    print(f"\nStatistics: {json.dumps(stats, indent=2)}")
    
    checker.close()
