import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { contentApi } from '@/services/api';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layout/MainLayout';
import {
  ImageIcon,
  Plus,
  Loader2,
  Settings,
  Eye,
  Save,
  X,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Maximize,
  Minimize,
  GripVertical,
  Upload,
  Link
} from 'lucide-react';

// Create context for fullscreen mode
const FullscreenContext = createContext<{
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}>({
  isFullscreen: false,
  setIsFullscreen: () => {}
});

// Wrapper component that provides fullscreen context
export const MinimalBlogWriterWrapper = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editorComponent = (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      <MinimalBlogWriter />
    </FullscreenContext.Provider>
  );

  // If fullscreen, render without any layout
  if (isFullscreen) {
    return editorComponent;
  }

  // If not fullscreen, render with MainLayout
  return (
    <MainLayout>
      {editorComponent}
    </MainLayout>
  );
};

const MinimalBlogWriter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFullscreen, setIsFullscreen } = useContext(FullscreenContext);
  const isEditing = !!id;
  
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Main content state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editorContent, setEditorContent] = useState<any[]>([{
    id: Date.now(),
    type: 'paragraph',
    content: '',
    placeholder: ''
  }]);

  // Publishing options state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishData, setPublishData] = useState({
    summary: '',
    category: '',
    tags: '',
    featured_image: '',
    allow_comments: true,
    is_published: true,
  });

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeTab, setActiveTab] = useState('Basic');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Drag and drop state
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Focus state
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);

  // Spell checker state
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [customSpellCheck, setCustomSpellCheck] = useState(false);

  // Grammar checker state
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(false);
  const [grammarIssues, setGrammarIssues] = useState<any[]>([]);
  const [grammarStats, setGrammarStats] = useState<any>({});
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [showGrammarPanel, setShowGrammarPanel] = useState(false);

  // Cover image state
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [coverImage, setCoverImage] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [
    'Constitutional Law',
    'Corporate Law',
    'Employment Law',
    'Intellectual Property',
    'Criminal Law',
    'Family Law',
    'General',
  ];

  // Command palette options
  const commandOptions = [
    {
      id: 'text',
      label: 'Text',
      description: 'Start writing with plain text',
      icon: Type,
      category: 'Basic',
      action: () => insertBlock('paragraph')
    },
    {
      id: 'heading1',
      label: 'Heading 1',
      description: 'Big heading',
      icon: Heading1,
      category: 'Basic',
      action: () => insertBlock('heading1')
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      description: 'Medium heading',
      icon: Heading2,
      category: 'Basic',
      action: () => insertBlock('heading2')
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      description: 'Small heading',
      icon: Heading3,
      category: 'Basic',
      action: () => insertBlock('heading3')
    },
    {
      id: 'heading4',
      label: 'Heading 4',
      description: 'Small heading',
      icon: Heading3,
      category: 'Basic',
      action: () => insertBlock('heading4')
    },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: List,
      category: 'Basic',
      action: () => insertBlock('bullet-list')
    },
    {
      id: 'numbered-list',
      label: 'Numbered List',
      description: 'Create a simple numbered list',
      icon: ListOrdered,
      category: 'Basic',
      action: () => insertBlock('numbered-list')
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Create a quote block',
      icon: Quote,
      category: 'Basic',
      action: () => insertBlock('quote')
    },
    {
      id: 'code',
      label: 'Code',
      description: 'Insert code block',
      icon: Code,
      category: 'Advanced',
      action: () => insertBlock('code')
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Add a horizontal line',
      icon: Minus,
      category: 'Basic',
      action: () => insertBlock('divider')
    }
  ];

  // Helper function to insert a new block or transform current block
  const insertBlock = (blockType: string) => {
    // Find the block that triggered the command (the one with "/")
    const currentBlockId = cursorPosition;

    setEditorContent(prev =>
      prev.map(block =>
        block.id === currentBlockId
          ? {
              ...block,
              type: blockType,
              content: '',
              placeholder: getPlaceholderForBlock(blockType)
            }
          : block
      )
    );

    setShowCommandPalette(false);
    setSelectedCommandIndex(0); // Reset selection

    // Focus the transformed block after a short delay
    setTimeout(() => {
      const blockElement = document.getElementById(`block-${currentBlockId}`);
      if (blockElement) {
        blockElement.focus();
      }
    }, 100);
  };

  // Get filtered command options for current tab
  const getFilteredCommandOptions = () => {
    return commandOptions.filter(option => option.category === activeTab);
  };

  // Advanced spell checking utility function with Google API integration option
  const checkSpelling = async (text: string): Promise<string[]> => {
    if (!customSpellCheck || !text.trim()) return [];

    try {
      // Option 1: Use Google's spell check API (requires API key)
      // Uncomment and configure this section to use Google's spell check
      /*
      const GOOGLE_API_KEY = 'your-google-api-key-here';
      const response = await fetch(`https://www.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Process Google's spell check response
        return data.misspelledWords || [];
      }
      */

      // Option 2: Browser's built-in spell check (already enabled via spellCheck attribute)
      // This is handled by the browser automatically

      // Option 3: Custom spell check using a comprehensive word list
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const misspelledWords: string[] = [];

      // Expanded list of common misspellings for demonstration
      const commonMisspellings = [
        'teh', 'recieve', 'seperate', 'occured', 'definately', 'neccessary',
        'accomodate', 'begining', 'beleive', 'calender', 'cemetary', 'changable',
        'collegue', 'comming', 'commited', 'concious', 'enviroment', 'existance',
        'goverment', 'harrass', 'independant', 'maintainance', 'occassion',
        'perseverence', 'priviledge', 'publically', 'reccomend', 'rythm',
        'succesful', 'tommorow', 'truely', 'untill', 'wierd', 'alot', 'alright',
        'basicly', 'buisness', 'choosen', 'completly', 'diferent', 'difinitely',
        'embarass', 'finaly', 'fourty', 'freind', 'gratefull', 'happend',
        'immediatly', 'intresting', 'knowlege', 'lenght', 'mispell', 'noticable',
        'occassionally', 'paralell', 'posession', 'recieved', 'seperation',
        'similiar', 'suprise', 'thier', 'usefull', 'wether'
      ];

      words.forEach(word => {
        if (commonMisspellings.includes(word)) {
          misspelledWords.push(word);
        }
      });

      return misspelledWords;
    } catch (error) {
      console.error('Spell check error:', error);
      return [];
    }
  };

  // Get spell check suggestions
  const getSpellingSuggestions = (word: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'teh': ['the'],
      'recieve': ['receive'],
      'seperate': ['separate'],
      'occured': ['occurred'],
      'definately': ['definitely'],
      'neccessary': ['necessary'],
      'accomodate': ['accommodate'],
      'begining': ['beginning'],
      'beleive': ['believe'],
      'calender': ['calendar'],
      'cemetary': ['cemetery'],
      'changable': ['changeable'],
      'collegue': ['colleague'],
      'comming': ['coming'],
      'commited': ['committed'],
      'concious': ['conscious'],
      'enviroment': ['environment'],
      'existance': ['existence'],
      'goverment': ['government'],
      'harrass': ['harass'],
      'independant': ['independent'],
      'maintainance': ['maintenance'],
      'occassion': ['occasion'],
      'perseverence': ['perseverance'],
      'priviledge': ['privilege'],
      'publically': ['publicly'],
      'reccomend': ['recommend'],
      'rythm': ['rhythm'],
      'succesful': ['successful'],
      'tommorow': ['tomorrow'],
      'truely': ['truly'],
      'untill': ['until'],
      'wierd': ['weird']
    };

    return suggestions[word.toLowerCase()] || [];
  };

  // Toggle spell check
  const toggleSpellCheck = () => {
    setSpellCheckEnabled(!spellCheckEnabled);
  };

  // Toggle custom spell check
  const toggleCustomSpellCheck = () => {
    setCustomSpellCheck(!customSpellCheck);
  };

  // Grammar checking functions
  const checkGrammar = async (text: string) => {
    if (!grammarCheckEnabled || !text.trim()) return;

    setIsCheckingGrammar(true);
    try {
      const result = await contentApi.checkGrammar(text);
      if (result.success) {
        setGrammarIssues(result.issues);
        setGrammarStats(result.statistics);
        if (result.issues.length > 0) {
          setShowGrammarPanel(true);
        }
      } else {
        console.error('Grammar check failed:', result.error);
      }
    } catch (error) {
      console.error('Grammar check error:', error);
    } finally {
      setIsCheckingGrammar(false);
    }
  };

  const applySuggestion = async (issue: any, suggestionIndex: number = 0) => {
    if (!issue.replacements || suggestionIndex >= issue.replacements.length) return;

    const replacement = issue.replacements[suggestionIndex];
    const fullText = title + '\n\n' + convertToHTML();

    try {
      const result = await contentApi.applySuggestion(fullText, issue.offset, issue.length, replacement);
      if (result.success) {
        // Parse the corrected text back to title and content
        const lines = result.corrected_text.split('\n');
        const newTitle = lines[0] || '';
        const newContent = lines.slice(2).join('\n');

        setTitle(newTitle);
        // You might need to convert HTML back to editor blocks here
        // For now, just refresh grammar check
        checkGrammar(result.corrected_text);
      }
    } catch (error) {
      console.error('Apply suggestion error:', error);
    }
  };

  const toggleGrammarCheck = () => {
    setGrammarCheckEnabled(!grammarCheckEnabled);
    if (!grammarCheckEnabled) {
      // When enabling, check current content
      const fullText = title + '\n\n' + convertToHTML();
      checkGrammar(fullText);
    } else {
      // When disabling, clear issues
      setGrammarIssues([]);
      setGrammarStats({});
      setShowGrammarPanel(false);
    }
  };

  // Auto-check grammar when content changes (debounced)
  useEffect(() => {
    if (!grammarCheckEnabled) return;

    const timeoutId = setTimeout(() => {
      const fullText = title + '\n\n' + convertToHTML();
      if (fullText.trim()) {
        checkGrammar(fullText);
      }
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [title, editorContent, grammarCheckEnabled]);

  // Get placeholder text for different block types
  const getPlaceholderForBlock = (blockType: string, blockId?: number, isFocused?: boolean) => {
    switch (blockType) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'heading4': return 'Heading 4';
      case 'bullet-list': return 'List item';
      case 'numbered-list': return 'List item';
      case 'quote': return 'Quote';
      case 'code': return 'Enter code...';
      case 'paragraph':
      default:
        // Only show command hint for focused paragraph blocks, otherwise blank
        return (isFocused && blockId === focusedBlockId) ? 'Type \'/\' for commands' : '';
    }
  };

  // Update block content
  const updateBlockContent = (blockId: number, newContent: string) => {
    setEditorContent(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, content: newContent }
          : block
      )
    );
  };

  // Delete block
  const deleteBlock = (blockId: number) => {
    setEditorContent(prev => {
      const filtered = prev.filter(block => block.id !== blockId);
      return filtered.length === 0 ? [{ id: Date.now(), type: 'paragraph', content: '', placeholder: '' }] : filtered;
    });
  };

  // Convert editor content to HTML for saving
  const convertToHTML = () => {
    return editorContent.map(block => {
      const content = block.content || '';
      switch (block.type) {
        case 'heading1': return `<h1>${content}</h1>`;
        case 'heading2': return `<h2>${content}</h2>`;
        case 'heading3': return `<h3>${content}</h3>`;
        case 'heading4': return `<h4>${content}</h4>`;
        case 'bullet-list': return `<ul><li>${content}</li></ul>`;
        case 'numbered-list': return `<ol><li>${content}</li></ol>`;
        case 'quote': return `<blockquote>${content}</blockquote>`;
        case 'code': return `<pre><code>${content}</code></pre>`;
        case 'divider': return '<hr>';
        case 'paragraph':
        default: return `<p>${content}</p>`;
      }
    }).join('\n');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, blockId: number) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedBlock === null) return;

    const draggedIndex = editorContent.findIndex(block => block.id === draggedBlock);
    if (draggedIndex === -1) return;

    const newContent = [...editorContent];
    const [draggedItem] = newContent.splice(draggedIndex, 1);
    newContent.splice(dropIndex, 0, draggedItem);

    setEditorContent(newContent);
    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  // Handle block content change and detect "/" command
  const handleBlockContentChange = (blockId: number, newContent: string, element: HTMLElement) => {
    updateBlockContent(blockId, newContent);

    // Check if user typed "/" at the beginning of the content
    if (newContent === '/') {
      // Get element position and calculate a position very close to the text
      const elementRect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Position the palette 100px above and 150px to the left
      setCommandPalettePosition({
        top: elementRect.top + scrollTop - 100, // Position 100px above the line
        left: elementRect.left + scrollLeft - 150 // Position 150px to the left
      });

      setShowCommandPalette(true);
      setSelectedCommandIndex(0);
      setCursorPosition(blockId);
    } else if (showCommandPalette && newContent !== '/') {
      setShowCommandPalette(false);
    }
  };

  // Handle keyboard events in blocks
  const handleBlockKeyDown = (e: React.KeyboardEvent, blockId: number, blockIndex: number) => {
    // Handle command palette navigation
    if (showCommandPalette) {
      const filteredOptions = getFilteredCommandOptions();

      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedOption = filteredOptions[selectedCommandIndex];
        if (selectedOption) {
          selectedOption.action();
        }
        return;
      }
    }

    // Handle Enter key to create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentBlock = editorContent[blockIndex];

      // Determine the type of new block based on current block
      let newBlockType = 'paragraph';
      if (currentBlock.type === 'bullet-list' || currentBlock.type === 'numbered-list') {
        // If current block has content, create same type of list item
        // If empty, convert to paragraph
        newBlockType = currentBlock.content.trim() ? currentBlock.type : 'paragraph';
      }

      const newBlock = {
        id: Date.now(),
        type: newBlockType,
        content: '',
        placeholder: getPlaceholderForBlock(newBlockType)
      };

      setEditorContent(prev => {
        const newContent = [...prev];
        newContent.splice(blockIndex + 1, 0, newBlock);
        return newContent;
      });

      // Focus the new block
      setTimeout(() => {
        const newBlockElement = document.getElementById(`block-${newBlock.id}`);
        if (newBlockElement) {
          newBlockElement.focus();
        }
      }, 50);
    }

    // Handle Backspace on empty block
    if (e.key === 'Backspace') {
      const target = e.target as HTMLElement;
      const currentBlock = editorContent[blockIndex];
      const selection = window.getSelection();
      const isAtStart = selection && selection.anchorOffset === 0;

      // Check if we're at the start of an empty list item - convert to paragraph
      if (isAtStart && target.textContent === '' &&
          (currentBlock.type === 'bullet-list' || currentBlock.type === 'numbered-list')) {
        e.preventDefault();
        setEditorContent(prev =>
          prev.map(block =>
            block.id === blockId
              ? {
                  ...block,
                  type: 'paragraph',
                  placeholder: getPlaceholderForBlock('paragraph')
                }
              : block
          )
        );
        return;
      }

      // Handle deleting empty blocks (but not list items, they get converted above)
      if (target.textContent === '' && editorContent.length > 1 &&
          currentBlock.type !== 'bullet-list' && currentBlock.type !== 'numbered-list') {
        e.preventDefault();
        deleteBlock(blockId);

        // Focus previous block if exists
        if (blockIndex > 0) {
          const prevBlock = editorContent[blockIndex - 1];
          setTimeout(() => {
            const prevBlockElement = document.getElementById(`block-${prevBlock.id}`);
            if (prevBlockElement) {
              prevBlockElement.focus();
              // Move cursor to end
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(prevBlockElement);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }, 50);
        }
      }
    }
  };

  // Auto-focus title on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  // Set initial focused block
  useEffect(() => {
    if (editorContent.length > 0 && !focusedBlockId) {
      setFocusedBlockId(editorContent[0].id);
    }
  }, [editorContent, focusedBlockId]);

  // Close command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCommandPalette && contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCommandPalette]);

  // Reset selected command index when active tab changes
  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [activeTab]);

  // Load existing post if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const response = await contentApi.getBlogPost(parseInt(id));
          const post = response.blog_post;
          
          setTitle(post.title);
          setContent(post.content);

          // Parse HTML content back to blocks (simplified)
          if (post.content) {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(post.content, 'text/html');
              const blocks: any[] = [];

              doc.body.childNodes.forEach((node, index) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  const tagName = element.tagName.toLowerCase();
                  let blockType = 'paragraph';

                  switch (tagName) {
                    case 'h1': blockType = 'heading1'; break;
                    case 'h2': blockType = 'heading2'; break;
                    case 'h3': blockType = 'heading3'; break;
                    case 'h4': blockType = 'heading4'; break;
                    case 'ul': blockType = 'bullet-list'; break;
                    case 'ol': blockType = 'numbered-list'; break;
                    case 'blockquote': blockType = 'quote'; break;
                    case 'pre': blockType = 'code'; break;
                    case 'hr': blockType = 'divider'; break;
                    default: blockType = 'paragraph';
                  }

                  blocks.push({
                    id: Date.now() + index,
                    type: blockType,
                    content: element.textContent || '',
                    placeholder: getPlaceholderForBlock(blockType)
                  });
                }
              });

              if (blocks.length > 0) {
                setEditorContent(blocks);
              }
            } catch (error) {
              console.error('Error parsing content:', error);
            }
          }

          setPublishData({
            summary: post.summary || '',
            category: post.category || '',
            tags: post.tags || '',
            featured_image: post.featured_image || '',
            allow_comments: post.allow_comments,
            is_published: post.is_published,
          });

          // Synchronize coverImage state with loaded featured_image
          setCoverImage(post.featured_image || '');
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load blog post.",
            variant: "destructive",
          });
          navigate('/blogs');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, isEditing, navigate, toast]);

  const handlePublishClick = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title before publishing.",
        variant: "destructive",
      });
      titleRef.current?.focus();
      return;
    }
    
    const htmlContent = convertToHTML();
    if (!htmlContent.trim() || editorContent.every(block => !block.content.trim())) {
      toast({
        title: "Content Required",
        description: "Please add some content before publishing.",
        variant: "destructive",
      });
      return;
    }

    setShowPublishDialog(true);
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title to save as draft.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const draftData = {
        title: title.trim(),
        content: convertToHTML(),
        summary: publishData.summary.trim(),
        category: publishData.category,
        tags: publishData.tags.trim(),
        featured_image: publishData.featured_image.trim(),
        allow_comments: publishData.allow_comments,
        is_published: false,
      };

      if (isEditing && id) {
        await contentApi.updateBlogPost(parseInt(id), draftData);
        toast({
          title: "Draft Saved",
          description: "Your changes have been saved as draft.",
        });
      } else {
        const response = await contentApi.createBlogPost(draftData);
        toast({
          title: "Draft Saved",
          description: "Blog post saved as draft.",
        });
        navigate(`/blogs/${response.content_id}/edit`);
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const submitData = {
        title: title.trim(),
        content: convertToHTML(),
        summary: publishData.summary.trim(),
        category: publishData.category,
        tags: publishData.tags.trim(),
        featured_image: publishData.featured_image.trim(),
        allow_comments: publishData.allow_comments,
        is_published: publishData.is_published,
      };

      if (isEditing && id) {
        await contentApi.updateBlogPost(parseInt(id), submitData);
        toast({
          title: "Success",
          description: "Blog post updated successfully.",
        });
      } else {
        const response = await contentApi.createBlogPost(submitData);
        toast({
          title: "Success",
          description: "Blog post published successfully.",
        });
        navigate(`/blogs/${response.content_id}`);
        return;
      }

      navigate('/blogs');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish blog post.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setShowPublishDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Custom styles for contentEditable placeholders and spell check */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          position: absolute;
          opacity: 1;
        }
        [contenteditable]:focus:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          opacity: 0.7;
        }
        [contenteditable]:not(:empty):before {
          content: '';
        }
        .editor-block {
          position: relative;
        }

        /* Spell check styles */
        .spell-error {
          background: linear-gradient(to bottom, transparent 0%, transparent 50%, #ef4444 50%, #ef4444 100%);
          background-size: 2px 2px;
          background-repeat: repeat-x;
          background-position: bottom;
        }

        /* Grammar check styles */
        .grammar-error {
          background: linear-gradient(to bottom, transparent 0%, transparent 50%, #f59e0b 50%, #f59e0b 100%);
          background-size: 2px 2px;
          background-repeat: repeat-x;
          background-position: bottom;
        }
      `}</style>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo/Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/blogs')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">Draft</span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || !title.trim()}
                className="text-gray-600 hover:text-gray-900"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>

              {/* Spell Check Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSpellCheck}
                className={cn(
                  "px-3 py-2 min-w-[60px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors",
                  spellCheckEnabled && "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                )}
                title={spellCheckEnabled ? "Disable Spell Check" : "Enable Spell Check"}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">ABC</span>
                  <span className="text-xs font-medium">Spell</span>
                </div>
              </Button>

              {/* Grammar Check Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleGrammarCheck}
                className={cn(
                  "px-3 py-2 min-w-[60px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors",
                  grammarCheckEnabled && "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                )}
                title={grammarCheckEnabled ? "Disable Grammar Check" : "Enable Grammar Check"}
                disabled={isCheckingGrammar}
              >
                {isCheckingGrammar ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs font-medium">Checking...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">G</span>
                    <span className="text-xs font-medium">Grammar</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={handlePublishClick}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Cover Image */}
          {coverImage && (
            <div className="relative mb-8">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setCoverImage('');
                  setPublishData({ ...publishData, featured_image: '' });
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Add Cover Image Button */}
          {!coverImage && (
            <button
              onClick={() => setShowCoverDialog(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm">Add Cover</span>
            </button>
          )}

          {/* Title Input */}
          <div>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title..."
              spellCheck={spellCheckEnabled}
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none bg-transparent"
              style={{ lineHeight: '1.2' }}
            />
          </div>

          {/* Block Editor */}
          <div className="relative">
            <div className="space-y-2">
              {editorContent.map((block, index) => (
                <EditorBlock
                  key={block.id}
                  block={block}
                  index={index}
                  onContentChange={handleBlockContentChange}
                  onKeyDown={handleBlockKeyDown}
                  onDelete={deleteBlock}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onFocus={setFocusedBlockId}
                  onBlur={() => setFocusedBlockId(null)}
                  isDragging={draggedBlock === block.id}
                  isDragOver={dragOverIndex === index}
                  isFocused={focusedBlockId === block.id}
                  spellCheckEnabled={spellCheckEnabled}
                />
              ))}
            </div>

            {/* Command Palette */}
            {showCommandPalette && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 min-w-[320px]"
                style={{
                  top: commandPalettePosition.top,
                  left: Math.min(commandPalettePosition.left, window.innerWidth - 340)
                }}
              >
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg mb-3">
                  {['Basic', 'Advanced', 'Media'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedCommandIndex(0);
                      }}
                      className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150",
                        activeTab === tab
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Command Options */}
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {getFilteredCommandOptions()
                    .map((option, index) => (
                      <button
                        key={option.id}
                        onClick={option.action}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors duration-150",
                          index === selectedCommandIndex
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg",
                          index === selectedCommandIndex
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        )}>
                          <option.icon className={cn(
                            "h-4 w-4",
                            index === selectedCommandIndex
                              ? "text-blue-600"
                              : "text-gray-600"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "font-medium text-sm",
                            index === selectedCommandIndex
                              ? "text-blue-900"
                              : "text-gray-900"
                          )}>
                            {option.label}
                          </div>
                          <div className={cn(
                            "text-xs mt-0.5",
                            index === selectedCommandIndex
                              ? "text-blue-600"
                              : "text-gray-500"
                          )}>
                            {option.description}
                          </div>
                        </div>
                      </button>
                    ))}

                  {/* Show message if no options in current tab */}
                  {commandOptions.filter(option => option.category === activeTab).length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {activeTab === 'AI' && 'AI features coming soon...'}
                      {activeTab === 'Embeds' && 'Embed features coming soon...'}
                      {activeTab !== 'AI' && activeTab !== 'Embeds' && 'No options available'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        publishData={publishData}
        setPublishData={setPublishData}
        onPublish={handlePublish}
        saving={saving}
        categories={categories}
        isEditing={isEditing}
      />

      {/* Grammar Check Panel */}
      {showGrammarPanel && grammarIssues.length > 0 && (
        <div className="fixed right-4 top-20 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Grammar Issues</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGrammarPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Found {grammarStats.total_issues || 0} issues
            </div>
          </div>

          <div className="p-4 space-y-3">
            {grammarIssues.map((issue, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {issue.short_message || issue.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {issue.issue_type}
                    </div>
                    {issue.context && (
                      <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                        {issue.context}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      issue.issue_type === 'grammar' ? 'destructive' :
                      issue.issue_type === 'spelling' ? 'destructive' :
                      issue.issue_type === 'punctuation' ? 'default' : 'secondary'
                    }
                    className="ml-2"
                  >
                    {issue.issue_type}
                  </Badge>
                </div>

                {issue.replacements && issue.replacements.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Suggestions:</div>
                    <div className="flex flex-wrap gap-1">
                      {issue.replacements.slice(0, 3).map((suggestion: string, suggestionIndex: number) => (
                        <Button
                          key={suggestionIndex}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => applySuggestion(issue, suggestionIndex)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell Check Status Indicator */}
      {spellCheckEnabled && (
        <div className="fixed bottom-4 right-4 bg-white border border-blue-200 rounded-lg shadow-lg p-3 z-40 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-blue-700">
              <span className="text-xs font-semibold">ABC</span>
              <span className="text-xs font-medium">Spell</span>
            </div>
            <span className="text-xs text-gray-600">
              {customSpellCheck ? 'Enhanced' : 'Browser'}
            </span>
            <button
              onClick={toggleCustomSpellCheck}
              className="text-xs text-blue-600 hover:text-blue-700 underline font-medium"
            >
              {customSpellCheck ? 'Basic' : 'Enhanced'}
            </button>
          </div>
        </div>
      )}

      {/* Grammar Check Status Indicator */}
      {grammarCheckEnabled && (
        <div className="fixed bottom-4 right-4 bg-white border border-green-200 rounded-lg shadow-lg p-3 z-40 min-w-[220px]"
             style={{ bottom: spellCheckEnabled ? '80px' : '16px' }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-green-700">
              <span className="text-xs font-semibold">G</span>
              <span className="text-xs font-medium">Grammar</span>
            </div>
            <span className="text-xs text-gray-600">
              {grammarStats.total_issues || 0} issues
            </span>
            {grammarIssues.length > 0 && (
              <button
                onClick={() => setShowGrammarPanel(!showGrammarPanel)}
                className="text-xs text-green-600 hover:text-green-700 underline font-medium"
              >
                {showGrammarPanel ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cover Image Dialog */}
      <CoverImageDialog
        open={showCoverDialog}
        onClose={() => setShowCoverDialog(false)}
        onImageSet={(imageUrl) => {
          setCoverImage(imageUrl);
          setPublishData({ ...publishData, featured_image: imageUrl });
        }}
      />
    </div>
  );
};

// Separate component for the publish dialog
interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  publishData: any;
  setPublishData: (data: any) => void;
  onPublish: () => void;
  saving: boolean;
  categories: string[];
  isEditing: boolean;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onClose,
  publishData,
  setPublishData,
  onPublish,
  saving,
  categories,
  isEditing
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ready to publish?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={publishData.summary}
              onChange={(e) => setPublishData({ ...publishData, summary: e.target.value })}
              placeholder="Brief summary of your article..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={publishData.category}
              onValueChange={(value) => setPublishData({ ...publishData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={publishData.tags}
              onChange={(e) => setPublishData({ ...publishData, tags: e.target.value })}
              placeholder="legal, corporate, analysis (comma separated)"
            />
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Allow Comments</Label>
              <Switch
                id="comments"
                checked={publishData.allow_comments}
                onCheckedChange={(checked) => setPublishData({ ...publishData, allow_comments: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onPublish} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                isEditing ? 'Update' : 'Publish'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// EditorBlock component for individual content blocks
interface EditorBlockProps {
  block: any;
  index: number;
  onContentChange: (blockId: number, content: string, element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent, blockId: number, index: number) => void;
  onDelete: (blockId: number) => void;
  onDragStart: (e: React.DragEvent, blockId: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onFocus: (blockId: number) => void;
  onBlur: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  isFocused: boolean;
  spellCheckEnabled: boolean;
}

const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  index,
  onContentChange,
  onKeyDown,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onFocus,
  onBlur,
  isDragging,
  isDragOver,
  isFocused,
  spellCheckEnabled
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dragHandleHovered, setDragHandleHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const content = target.textContent || '';
    onContentChange(block.id, content, target);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown(e, block.id, index);
  };

  const handleFocus = () => {
    onFocus(block.id);
  };

  const handleBlur = () => {
    onBlur();
  };

  // Enhanced hover handlers for better drag handle interaction
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to allow moving to drag handle
    if (!dragHandleHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 150);
    }
  };

  const handleDragHandleMouseEnter = () => {
    setDragHandleHovered(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDragHandleMouseLeave = () => {
    setDragHandleHovered(false);
    // Hide the drag handle after a short delay
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Set initial content when block is created (only once)
  useEffect(() => {
    if (blockRef.current && block.content && blockRef.current.textContent !== block.content) {
      blockRef.current.textContent = block.content;
    }
  }, []);

  const getBlockStyles = () => {
    const baseStyles = "w-full border-none outline-none resize-none bg-transparent leading-relaxed focus:outline-none";

    switch (block.type) {
      case 'heading1':
        return `${baseStyles} text-4xl font-bold text-gray-900 py-2`;
      case 'heading2':
        return `${baseStyles} text-3xl font-bold text-gray-900 py-2`;
      case 'heading3':
        return `${baseStyles} text-2xl font-bold text-gray-900 py-1`;
      case 'heading4':
        return `${baseStyles} text-xl font-bold text-gray-900 py-1`;
      case 'bullet-list':
        return `${baseStyles} text-lg text-gray-700 pl-6 relative`;
      case 'numbered-list':
        return `${baseStyles} text-lg text-gray-700 pl-6 relative`;
      case 'quote':
        return `${baseStyles} text-lg text-gray-600 italic border-l-4 border-gray-300 pl-4 py-2`;
      case 'code':
        return `${baseStyles} text-sm font-mono bg-gray-100 text-gray-800 p-4 rounded-lg`;
      case 'paragraph':
      default:
        return `${baseStyles} text-lg text-gray-700 py-1`;
    }
  };

  const renderBlock = () => {
    if (block.type === 'divider') {
      return (
        <div
          className={cn(
            "py-4 group relative",
            isDragOver && "border-t-2 border-blue-500",
            isDragging && "opacity-50"
          )}
          draggable
          onDragStart={(e) => onDragStart(e, block.id)}
          onDragOver={(e) => onDragOver(e, index)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, index)}
          onDragEnd={onDragEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Drag Handle */}
          {isHovered && (
            <div
              className="absolute left-[-30px] top-1/2 transform -translate-y-1/2 opacity-100 transition-opacity p-1"
              onMouseEnter={handleDragHandleMouseEnter}
              onMouseLeave={handleDragHandleMouseLeave}
            >
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
            </div>
          )}
          <hr className="border-gray-300" />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative group",
          isDragOver && "border-t-2 border-blue-500",
          isDragging && "opacity-50"
        )}
        draggable
        onDragStart={(e) => onDragStart(e, block.id)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
        onDragEnd={onDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Drag Handle */}
        {isHovered && (
          <div
            className="absolute left-[-30px] top-1/2 transform -translate-y-1/2 opacity-100 transition-opacity p-1"
            onMouseEnter={handleDragHandleMouseEnter}
            onMouseLeave={handleDragHandleMouseLeave}
          >
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
          </div>
        )}

        {/* List bullet/number for list items */}
        {block.type === 'bullet-list' && (
          <span className="absolute left-2 top-1 text-gray-400">•</span>
        )}
        {block.type === 'numbered-list' && (
          <span className="absolute left-2 top-1 text-gray-400">{index + 1}.</span>
        )}

        <div
          ref={blockRef}
          id={`block-${block.id}`}
          contentEditable
          suppressContentEditableWarning
          spellCheck={spellCheckEnabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(getBlockStyles(), 'editor-block')}
          data-placeholder={block.content ? '' : (block.type === 'paragraph' ? (isFocused ? 'Type \'/\' for commands' : '') : block.placeholder)}
          style={{
            minHeight: block.type.startsWith('heading') ? 'auto' : '1.5em'
          }}
        />
      </div>
    );
  };

  return renderBlock();
};

// Cover Image Dialog Component
interface CoverImageDialogProps {
  open: boolean;
  onClose: () => void;
  onImageSet: (imageUrl: string) => void;
}

const CoverImageDialog: React.FC<CoverImageDialogProps> = ({
  open,
  onClose,
  onImageSet
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (imageUrl.trim()) {
      onImageSet(imageUrl.trim());
      onClose();
      setImageUrl('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for the uploaded file
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cover Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Method Selection */}
          <div className="flex gap-2">
            <Button
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('url')}
              className="flex-1"
            >
              <Link className="h-4 w-4 mr-2" />
              URL
            </Button>
            <Button
              variant={uploadMethod === 'upload' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('upload')}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {/* File Upload */}
          {uploadMethod === 'upload' && (
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {imageUrl && (
                <p className="text-sm text-gray-600">File selected</p>
              )}
            </div>
          )}

          {/* Preview */}
          {imageUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded border"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!imageUrl.trim()}>
              Add Cover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MinimalBlogWriterWrapper;
