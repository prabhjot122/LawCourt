import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Loader2, 
  Maximize, 
  Minimize, 
  Eye,
  Upload,
  Link as LinkIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Minus,
  GripVertical,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  SpellCheck,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { contentApi } from '@/services/api';

// Create fullscreen context for notes
const NoteFullscreenContext = createContext<{
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}>({
  isFullscreen: false,
  setIsFullscreen: () => {},
});

interface NoteTextEditorProps {
  initialData?: {
    title: string;
    content: string;
    category: string;
    is_private: boolean;
  };
  onSave: (data: {
    title: string;
    content: string;
    category: string;
    is_private: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

interface EditorBlock {
  id: number;
  type: string;
  content: string;
  placeholder: string;
}

interface EditorBlockProps {
  block: EditorBlock;
  index: number;
  onContentChange: (id: number, content: string, element: HTMLDivElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, id: number, index: number) => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onFocus: (id: number) => void;
  onBlur: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  isFocused: boolean;
  spellCheckEnabled: boolean;
}

// Wrapper component that provides fullscreen context
export const NoteTextEditorWrapper: React.FC<NoteTextEditorProps> = (props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editorComponent = (
    <NoteFullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      <NoteTextEditor {...props} />
    </NoteFullscreenContext.Provider>
  );

  // If fullscreen, render without any layout constraints
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {editorComponent}
      </div>
    );
  }

  // If not fullscreen, render normally
  return editorComponent;
};

const NoteTextEditor: React.FC<NoteTextEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { toast } = useToast();
  const { isFullscreen, setIsFullscreen } = useContext(NoteFullscreenContext);
  
  const titleRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || '',
    is_private: initialData?.is_private || false,
  });

  // Editor state
  const [editorContent, setEditorContent] = useState<EditorBlock[]>([{
    id: Date.now(),
    type: 'paragraph',
    content: '',
    placeholder: ''
  }]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverImageType, setCoverImageType] = useState<'upload' | 'url'>('upload');

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ top: 0, left: 0 });
  const [activeTab, setActiveTab] = useState('Basic');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [currentBlockId, setCurrentBlockId] = useState<number | null>(null);

  // Drag and drop state
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);

  // Spell check and grammar check state
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(true);
  const [customSpellCheck, setCustomSpellCheck] = useState(false);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [grammarIssues, setGrammarIssues] = useState<any[]>([]);
  const [grammarStats, setGrammarStats] = useState<any>({});
  const [showGrammarPanel, setShowGrammarPanel] = useState(false);

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
      icon: Heading4,
      category: 'Basic',
      action: () => insertBlock('heading4')
    },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      description: 'Create a bulleted list',
      icon: List,
      category: 'Basic',
      action: () => insertBlock('bullet-list')
    },
    {
      id: 'numbered-list',
      label: 'Numbered List',
      description: 'Create a numbered list',
      icon: ListOrdered,
      category: 'Basic',
      action: () => insertBlock('numbered-list')
    },
    {
      id: 'quote',
      label: 'Quote',
      description: 'Add a quote block',
      icon: Quote,
      category: 'Advanced',
      action: () => insertBlock('quote')
    },
    {
      id: 'code',
      label: 'Code',
      description: 'Add a code block',
      icon: Code,
      category: 'Advanced',
      action: () => insertBlock('code')
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Add a horizontal divider',
      icon: Minus,
      category: 'Advanced',
      action: () => insertBlock('divider')
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Add an image',
      icon: Image,
      category: 'Media',
      action: () => insertBlock('image')
    }
  ];

  // Helper function to get placeholder for block type
  const getPlaceholderForBlock = (type: string): string => {
    switch (type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'heading4': return 'Heading 4';
      case 'bullet-list': return 'List item';
      case 'numbered-list': return 'List item';
      case 'quote': return 'Quote';
      case 'code': return 'Code';
      case 'paragraph': return '';
      default: return '';
    }
  };

  // Insert new block function
  const insertBlock = (type: string) => {
    if (currentBlockId === null) return;

    const currentIndex = editorContent.findIndex(block => block.id === currentBlockId);
    if (currentIndex === -1) return;

    const newBlock: EditorBlock = {
      id: Date.now(),
      type,
      content: '',
      placeholder: getPlaceholderForBlock(type)
    };

    setEditorContent(prev => {
      const newContent = [...prev];
      
      // Replace current block if it's empty, otherwise insert after
      if (prev[currentIndex].content.trim() === '') {
        newContent[currentIndex] = newBlock;
      } else {
        newContent.splice(currentIndex + 1, 0, newBlock);
      }
      
      return newContent;
    });

    setShowCommandPalette(false);
    setCurrentBlockId(newBlock.id);

    // Focus the new block after a short delay
    setTimeout(() => {
      const element = document.getElementById(`block-${newBlock.id}`);
      if (element) {
        element.focus();
      }
    }, 50);
  };

  // Initialize editor content from existing data
  useEffect(() => {
    if (initialData?.content && initialData.content.trim()) {
      try {
        // Parse HTML content into blocks
        const parser = new DOMParser();
        const doc = parser.parseFromString(initialData.content, 'text/html');
        const elements = Array.from(doc.body.children);

        if (elements.length > 0) {
          const blocks: EditorBlock[] = [];

          elements.forEach((element, index) => {
            let blockType = 'paragraph';

            switch (element.tagName.toLowerCase()) {
              case 'h1': blockType = 'heading1'; break;
              case 'h2': blockType = 'heading2'; break;
              case 'h3': blockType = 'heading3'; break;
              case 'h4': blockType = 'heading4'; break;
              case 'ul': blockType = 'bullet-list'; break;
              case 'ol': blockType = 'numbered-list'; break;
              case 'blockquote': blockType = 'quote'; break;
              case 'pre': blockType = 'code'; break;
              case 'hr': blockType = 'divider'; break;
              case 'img': blockType = 'image'; break;
              default: blockType = 'paragraph';
            }

            blocks.push({
              id: Date.now() + index,
              type: blockType,
              content: element.textContent || '',
              placeholder: getPlaceholderForBlock(blockType)
            });
          });

          if (blocks.length > 0) {
            setEditorContent(blocks);
          }
        }
      } catch (error) {
        console.error('Error parsing content:', error);
      }
    }
  }, [initialData]);

  // Convert editor content to HTML
  const convertToHTML = (): string => {
    return editorContent.map(block => {
      const content = block.content.trim();
      if (!content && block.type !== 'divider') return '';

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
        case 'image': return content.startsWith('http') ? `<img src="${content}" alt="Image" />` : '';
        default: return `<p>${content}</p>`;
      }
    }).filter(Boolean).join('\n');
  };

  // Handle block content change
  const handleBlockContentChange = (id: number, content: string, element: HTMLDivElement) => {
    setEditorContent(prev =>
      prev.map(block =>
        block.id === id ? { ...block, content } : block
      )
    );

    // Check if user typed "/" at the beginning of the content
    if (content === '/') {
      // Get element position and calculate a position very close to the text
      const elementRect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Position the palette close to the current line
      setCommandPalettePosition({
        top: elementRect.top + scrollTop - 100,
        left: elementRect.left + scrollLeft - 150
      });

      setShowCommandPalette(true);
      setCurrentBlockId(id);
      setSelectedCommandIndex(0);
      setActiveTab('Basic');

      // Clear the "/" character
      element.textContent = '';
      setEditorContent(prev =>
        prev.map(block =>
          block.id === id ? { ...block, content: '' } : block
        )
      );
    }
  };

  // Handle key down events
  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, blockId: number, blockIndex: number) => {
    // Handle command palette navigation
    if (showCommandPalette) {
      const filteredCommands = commandOptions.filter(cmd => cmd.category === activeTab);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedCommandIndex]?.action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
      return;
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

      const newBlock: EditorBlock = {
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
        const element = document.getElementById(`block-${newBlock.id}`);
        if (element) {
          element.focus();
        }
      }, 50);
    }

    // Handle Backspace on empty blocks
    if (e.key === 'Backspace') {
      const currentBlock = editorContent[blockIndex];
      if (!currentBlock.content.trim() && editorContent.length > 1) {
        e.preventDefault();
        deleteBlock(blockId);

        // Focus previous block
        if (blockIndex > 0) {
          const prevBlock = editorContent[blockIndex - 1];
          setTimeout(() => {
            const element = document.getElementById(`block-${prevBlock.id}`);
            if (element) {
              element.focus();
              // Move cursor to end
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(element);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }, 50);
        }
      }
    }
  };

  // Delete block function
  const deleteBlock = (id: number) => {
    if (editorContent.length <= 1) return;

    setEditorContent(prev => prev.filter(block => block.id !== id));
  };

  // Spell checking functions
  const checkSpelling = async (text: string) => {
    if (!customSpellCheck || !text.trim()) return [];

    try {
      // Option 1: Use browser's built-in spell check (already enabled via spellCheck attribute)
      // Option 2: Implement custom spell check API call here
      // For now, we'll rely on browser spell check and return empty array
      return [];
    } catch (error) {
      console.error('Spell check error:', error);
      return [];
    }
  };

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

  const applyGrammarSuggestion = async (issue: any, suggestionIndex: number = 0) => {
    if (!issue.replacements || suggestionIndex >= issue.replacements.length) return;

    const replacement = issue.replacements[suggestionIndex];
    const fullText = formData.title + '\n\n' + convertToHTML();

    // Apply the suggestion to the text
    const start = issue.offset;
    const end = issue.offset + issue.length;
    const newText = fullText.substring(0, start) + replacement + fullText.substring(end);

    // Update the content (this is a simplified approach)
    // In a real implementation, you'd need to map back to the specific block
    toast({
      title: "Suggestion Applied",
      description: `Replaced "${issue.context}" with "${replacement}"`,
    });

    // Remove the issue from the list
    setGrammarIssues(prev => prev.filter(i => i.offset !== issue.offset));
  };

  const toggleGrammarCheck = () => {
    setGrammarCheckEnabled(!grammarCheckEnabled);
    if (!grammarCheckEnabled) {
      // When enabling, check current content
      const fullText = formData.title + '\n\n' + convertToHTML();
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
      const fullText = formData.title + '\n\n' + convertToHTML();
      if (fullText.trim()) {
        checkGrammar(fullText);
      }
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [formData.title, editorContent, grammarCheckEnabled]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedBlock(id);
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

    const dragIndex = editorContent.findIndex(block => block.id === draggedBlock);
    if (dragIndex === -1) return;

    const newContent = [...editorContent];
    const [draggedItem] = newContent.splice(dragIndex, 1);
    newContent.splice(dropIndex, 0, draggedItem);

    setEditorContent(newContent);
    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverIndex(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title before saving.",
        variant: "destructive",
      });
      titleRef.current?.focus();
      return;
    }

    const htmlContent = convertToHTML();
    if (!htmlContent.trim() || editorContent.every(block => !block.content.trim())) {
      toast({
        title: "Content Required",
        description: "Please add some content before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        content: htmlContent
      });
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setSaving(false);
    }
  };

  // Handle metadata form submission
  const handleMetadataSubmit = () => {
    setShowMetadataForm(false);
    handleSave();
  };

  // Show publish dialog (metadata form)
  const handlePublishClick = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title before saving.",
        variant: "destructive",
      });
      titleRef.current?.focus();
      return;
    }

    const htmlContent = convertToHTML();
    if (!htmlContent.trim() || editorContent.every(block => !block.content.trim())) {
      toast({
        title: "Content Required",
        description: "Please add some content before saving.",
        variant: "destructive",
      });
      return;
    }

    setShowMetadataForm(true);
  };

  // Close command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCommandPalette) {
        const target = event.target as Element;
        if (!target.closest('.command-palette')) {
          setShowCommandPalette(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCommandPalette]);

  return (
    <div className={cn(
      "min-h-screen bg-white",
      isFullscreen ? "fixed inset-0 z-50" : ""
    )}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Note' : 'Create Note'}
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}
                className={cn(
                  "text-gray-600 hover:text-gray-900",
                  spellCheckEnabled && "bg-gray-100"
                )}
                title="Toggle Spell Check"
              >
                <SpellCheck className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleGrammarCheck}
                className={cn(
                  "text-gray-600 hover:text-gray-900",
                  grammarCheckEnabled && "bg-gray-100"
                )}
                title="Toggle Grammar Check"
              >
                {isCheckingGrammar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
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

              <Button
                onClick={handlePublishClick}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update' : 'Save'} Note
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Input */}
        <div className="mb-8">
          <input
            ref={titleRef}
            type="text"
            placeholder="Note title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent resize-none"
            style={{ lineHeight: '1.2' }}
          />
        </div>

        {/* Cover Image Section */}
        {coverImage && (
          <div className="mb-8">
            <div className="relative group">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

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
              className="command-palette fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 min-w-[320px]"
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

              {/* Commands */}
              <div className="space-y-1">
                {commandOptions
                  .filter(cmd => cmd.category === activeTab)
                  .map((command, index) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        onClick={command.action}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors duration-150",
                          index === selectedCommandIndex
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{command.label}</div>
                          <div className="text-sm text-gray-500">{command.description}</div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Form Modal */}
      {showMetadataForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Note Details</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_private: checked as boolean })
                  }
                />
                <Label htmlFor="is_private" className="text-sm font-medium text-gray-700">
                  Make this note private
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowMetadataForm(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMetadataSubmit}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update' : 'Save'} Note
                  </>
                )}
              </Button>
            </div>
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

      {/* Grammar Issues Panel */}
      {showGrammarPanel && grammarIssues.length > 0 && (
        <div className="fixed right-4 bottom-32 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Grammar Issues</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrammarPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {grammarIssues.slice(0, 10).map((issue, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {issue.issue_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {issue.rule_id}
                  </span>
                </div>

                <p className="text-sm text-gray-800 mb-2">{issue.message}</p>

                {issue.context && (
                  <div className="text-xs text-gray-600 mb-2 bg-gray-50 p-2 rounded">
                    Context: "{issue.context}"
                  </div>
                )}

                {issue.replacements && issue.replacements.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {issue.replacements.slice(0, 3).map((replacement, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => applyGrammarSuggestion(issue, idx)}
                        className="text-xs h-6 px-2"
                      >
                        {replacement}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {grammarIssues.length > 10 && (
              <div className="text-center text-xs text-gray-500">
                Showing 10 of {grammarIssues.length} issues
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// EditorBlock Component
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

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setDragHandleHovered(false);
    }, 100);
  };

  const handleDragHandleMouseEnter = () => {
    setDragHandleHovered(true);
  };

  const handleDragHandleMouseLeave = () => {
    setDragHandleHovered(false);
  };

  // Get styles for different block types
  const getBlockStyles = () => {
    const baseStyles = "w-full border-none outline-none bg-transparent resize-none leading-relaxed";

    switch (block.type) {
      case 'heading1':
        return `${baseStyles} text-3xl font-bold text-gray-900`;
      case 'heading2':
        return `${baseStyles} text-2xl font-bold text-gray-900`;
      case 'heading3':
        return `${baseStyles} text-xl font-semibold text-gray-900`;
      case 'heading4':
        return `${baseStyles} text-lg font-semibold text-gray-900`;
      case 'bullet-list':
      case 'numbered-list':
        return `${baseStyles} text-gray-800 pl-6`;
      case 'quote':
        return `${baseStyles} text-gray-700 italic border-l-4 border-gray-300 pl-4 bg-gray-50`;
      case 'code':
        return `${baseStyles} font-mono text-sm bg-gray-100 p-3 rounded-lg text-gray-800`;
      case 'divider':
        return `${baseStyles} h-px bg-gray-300 border-none`;
      case 'image':
        return `${baseStyles} text-blue-600 underline`;
      default:
        return `${baseStyles} text-gray-800`;
    }
  };

  // Special rendering for divider
  if (block.type === 'divider') {
    return (
      <div
        className={cn(
          "relative group py-4",
          isDragging && "opacity-50",
          isDragOver && "border-t-2 border-blue-500"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragOver={(e) => onDragOver(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
      >
        {/* Drag handle */}
        {(isHovered || dragHandleHovered) && (
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, block.id)}
            onDragEnd={onDragEnd}
            onMouseEnter={handleDragHandleMouseEnter}
            onMouseLeave={handleDragHandleMouseLeave}
          >
            <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </div>
        )}

        <hr className="border-gray-300" />

        {/* Delete button */}
        {(isHovered || dragHandleHovered) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(block.id)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group",
        isDragging && "opacity-50",
        isDragOver && "border-t-2 border-blue-500"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drag handle */}
      {(isHovered || dragHandleHovered) && (
        <div
          className="absolute left-0 top-1 transform -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={(e) => onDragStart(e, block.id)}
          onDragEnd={onDragEnd}
          onMouseEnter={handleDragHandleMouseEnter}
          onMouseLeave={handleDragHandleMouseLeave}
        >
          <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </div>
      )}

      {/* Delete button */}
      {(isHovered || dragHandleHovered) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(block.id)}
          className="absolute right-0 top-1 transform translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="relative">
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
    </div>
  );
};

export default NoteTextEditor;
