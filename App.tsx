
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleKey, CharStyle, TextSegment, DEFAULT_TEXT } from './types';
import StyleButton from './components/StyleButton';
import StyledTextDisplay from './components/StyledTextDisplay';

const DYNAMIC_FONT_STYLE_ID = "custom-font-style-sheet";
const USER_UPLOADED_FONT_FAMILY = "UserUploadedFont";

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>(DEFAULT_TEXT);
  const [charStyles, setCharStyles] = useState<CharStyle[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggableTextRef = useRef<HTMLDivElement>(null);

  // Font state
  const [uploadedFontFamilyName, setUploadedFontFamilyName] = useState<string | null>(null);
  const [selectedSystemFont, setSelectedSystemFont] = useState<string>('');


  // Edit position state
  const [isEditingPosition, setIsEditingPosition] = useState<boolean>(false);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; textX: number; textY: number } | null>(null);

  // Resize state
  const [textScale, setTextScale] = useState<number>(1);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    initialScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const systemFonts = [
    { name: "Default Style", value: "" },
    { name: "Arial", value: "Arial, Helvetica, sans-serif" },
    { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { name: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
    { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Courier New", value: "'Courier New', Courier, monospace" },
    { name: "Impact (App Default)", value: "'Impact', 'Arial Black', sans-serif" },
    { name: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif"},
    { name: "Lucida Console", value: "'Lucida Console', Monaco, monospace"}
  ];

  useEffect(() => {
    const getInitialStyledChars = (): CharStyle[] => {
      const text = DEFAULT_TEXT;
      const lines = text.split('\n');
      const styledChars: CharStyle[] = [];

      const lineStylesInstructions: (StyleKey | { charIndexEnd: number, style: StyleKey }[])[] = [
        'yellow',
        'yellow',
        'blue',
        'blue',
        'yellow',
        'yellow',
        [
          { charIndexEnd: 6, style: 'yellow' },
          { charIndexEnd: 14, style: 'red' },
        ],
        'red',
      ];

      lines.forEach((line, lineIndex) => {
        const currentLineStyleInstruction = lineStylesInstructions[lineIndex];

        if (typeof currentLineStyleInstruction === 'string') {
          for (let i = 0; i < line.length; i++) {
            styledChars.push({ char: line[i], style: currentLineStyleInstruction });
          }
        } else if (Array.isArray(currentLineStyleInstruction)) {
          let lineCharIndex = 0;
          for (const char of line) {
            let charStyleForCurrentChar: StyleKey = 'none';
            for (const specificStyleRule of currentLineStyleInstruction) {
              if (lineCharIndex <= specificStyleRule.charIndexEnd) {
                charStyleForCurrentChar = specificStyleRule.style;
                break;
              }
            }
            styledChars.push({ char, style: charStyleForCurrentChar });
            lineCharIndex++;
          }
        }

        if (lineIndex < lines.length - 1) {
          const lastCharStyleOfLine = styledChars.length > 0 ? styledChars[styledChars.length - 1].style : 'none';
          styledChars.push({ char: '\n', style: lastCharStyleOfLine });
        }
      });
      return styledChars;
    };

    setCharStyles(getInitialStyledChars());
    if (inputText !== DEFAULT_TEXT) {
        setInputText(DEFAULT_TEXT);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);

    const newCharStyles: CharStyle[] = Array(newText.length).fill(null).map((_, i) => {
        const char = newText[i];
        if (i < charStyles.length) {
             return { char, style: charStyles[i]?.style || ('none' as StyleKey) };
        }
        return { char, style: 'none' as StyleKey };
    });
    if (newText.length < charStyles.length) {
        setCharStyles(newCharStyles.slice(0, newText.length));
    } else {
        setCharStyles(newCharStyles);
    }
  };

  const applyStyleToSelection = useCallback((styleKey: StyleKey) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;

    if (selectionStart === selectionEnd) return;

    setCharStyles((prevStyles) =>
      prevStyles.map((item, index) => {
        if (index >= selectionStart && index < selectionEnd) {
          return { ...item, char: inputText[index], style: styleKey };
        }
        return { ...item, char: inputText[index] };
      })
    );
  }, [inputText]);

  const segmentsToRender = React.useMemo((): TextSegment[] => {
    if (!charStyles.length && !inputText.length) return [];
    if (!charStyles.length && inputText.length > 0) return [{ text: inputText, styleKey: 'none'}];

    const segments: TextSegment[] = [];
    let currentSegmentText = "";
    let currentStyle = charStyles.length > 0 ? charStyles[0].style : 'none';

    for (let i = 0; i < charStyles.length; i++) {
        const charStyle = charStyles[i];
        if (!charStyle) continue;

        if (charStyle.style === currentStyle) {
            currentSegmentText += charStyle.char;
        } else {
            if (currentSegmentText.length > 0) {
            segments.push({ text: currentSegmentText, styleKey: currentStyle });
            }
            currentSegmentText = charStyle.char;
            currentStyle = charStyle.style;
        }
    }
    if (currentSegmentText.length > 0) {
        segments.push({ text: currentSegmentText, styleKey: currentStyle });
    }
    return segments;
  }, [charStyles, inputText]);

  const handleFontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid font file type. Please use TTF, OTF, WOFF, or WOFF2 files.");
        if(event.target) event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const fontDataUrl = e.target?.result as string;

        const existingStyleTag = document.getElementById(DYNAMIC_FONT_STYLE_ID);
        if (existingStyleTag) {
            existingStyleTag.remove();
        }

        const style = document.createElement('style');
        style.id = DYNAMIC_FONT_STYLE_ID;
        style.textContent = `
            @font-face {
                font-family: "${USER_UPLOADED_FONT_FAMILY}";
                src: url(${fontDataUrl});
            }
        `;
        document.head.appendChild(style);
        setUploadedFontFamilyName(USER_UPLOADED_FONT_FAMILY);
        setSelectedSystemFont(''); // Make uploaded font active by default
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = '';
  };

  const revertToDefaultFont = () => {
    const styleTag = document.getElementById(DYNAMIC_FONT_STYLE_ID);
    if (styleTag) {
        styleTag.remove();
    }
    setUploadedFontFamilyName(null);
    setSelectedSystemFont(''); // Reset system font selection as well
  };

  const handleSystemFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFontFamily = event.target.value;
    setSelectedSystemFont(newFontFamily);
    // If a system font is chosen (even "Default Style" which is value=""),
    // and an uploaded font exists, the priority logic in getFontFamily will handle it.
    // No need to explicitly clear uploadedFontFamilyName here, as "Default Style" option
    // should allow fallback to uploaded font.
  };


  const toggleEditMode = () => {
    setIsEditingPosition(prev => !prev);
    if (isEditingPosition) { // If turning off edit mode
        setIsDragging(false);
        setIsResizing(false); // Ensure resizing also stops
    }
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditingPosition || !draggableTextRef.current || isResizing) return;
    event.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      textX: textPosition.x,
      textY: textPosition.y,
    };
  }, [isEditingPosition, textPosition.x, textPosition.y, isResizing]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = event.clientX - dragStartRef.current.mouseX;
    const deltaY = event.clientY - dragStartRef.current.mouseY;

    setTextPosition({
        x: dragStartRef.current.textX + deltaX,
        y: dragStartRef.current.textY + deltaY,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Resize Handlers
  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent drag when clicking handle
    if (!isEditingPosition || !draggableTextRef.current) return;

    setIsResizing(true);
    const rect = draggableTextRef.current.getBoundingClientRect();
    resizeStartRef.current = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        initialScale: textScale,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
    };
  }, [isEditingPosition, textScale]);

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current) return;

    const { mouseX: startMouseX, mouseY: startMouseY, initialScale, centerX, centerY } = resizeStartRef.current;

    const initialDist = Math.sqrt(Math.pow(startMouseX - centerX, 2) + Math.pow(startMouseY - centerY, 2));
    const currentDist = Math.sqrt(Math.pow(event.clientX - centerX, 2) + Math.pow(event.clientY - centerY, 2));

    if (initialDist === 0) {
        setTextScale(initialScale);
        return;
    }

    const scaleMultiplier = currentDist / initialDist;
    let newScale = initialScale * scaleMultiplier;
    newScale = Math.max(0.1, newScale);
    newScale = Math.min(10, newScale);

    setTextScale(newScale);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
        setIsResizing(false);
        resizeStartRef.current = null;
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    } else {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);


  const styleButtons: { key: StyleKey; label: string; colorClass: string }[] = [
    { key: 'yellow', label: 'Yellow', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
    { key: 'red', label: 'Red', colorClass: 'bg-red-500 hover:bg-red-600' },
    { key: 'blue', label: 'Blue', colorClass: 'bg-blue-500 hover:bg-blue-600' },
    { key: 'none', label: 'Clear Style', colorClass: 'bg-gray-500 hover:bg-gray-600' },
  ];

  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-5px',
    right: '-5px',
    width: '12px',
    height: '12px',
    backgroundColor: 'rgb(34 197 94)',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'nwse-resize',
    zIndex: 100,
    transform: `scale(${1 / textScale})`,
  };

  const getFontFamily = () => {
    if (selectedSystemFont) {
      return selectedSystemFont; // Use selected system font if available
    }
    if (uploadedFontFamilyName) {
      return `"${USER_UPLOADED_FONT_FAMILY}", 'Impact', 'Arial Black', sans-serif`; // Fallback to uploaded font
    }
    return "'Impact', 'Arial Black', sans-serif"; // App's default font
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-8 text-white flex flex-col items-center">
      <header className="mb-8 text-center w-full max-w-4xl">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Text Style Animator
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">Select text, apply styles, upload fonts, choose system fonts, position, and scale your text.</p>
      </header>

      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
          <label htmlFor="textInput" className="block text-xl font-semibold mb-3 text-sky-400">
            Enter Your Text
          </label>
          <textarea
            id="textInput"
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            rows={10}
            className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-base resize-none"
            placeholder="Type or paste your text here..."
            aria-label="Text input for styling"
          />
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {styleButtons.map(({ key, label, colorClass }) => (
              <StyleButton
                key={key}
                label={label}
                colorClass={colorClass}
                onClick={() => applyStyleToSelection(key)}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div>
              <label htmlFor="system-font-select" className="block text-sm font-medium text-slate-300 mb-1">
                Choose System Font
              </label>
              <select
                id="system-font-select"
                value={selectedSystemFont}
                onChange={handleSystemFontChange}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                aria-label="Select a system font"
              >
                {systemFonts.map(font => (
                  <option key={font.name} value={font.value}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFontUpload}
                  className="hidden"
                  ref={fileInputRef}
                  id="font-upload-input"
                  aria-label="Upload custom font file"
                />
                <StyleButton
                  label="Upload Custom Font"
                  colorClass="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto"
                  onClick={() => fileInputRef.current?.click()}
                />
                {(uploadedFontFamilyName || selectedSystemFont) && (
                     <StyleButton
                        label="Revert to App Default Font"
                        colorClass="bg-slate-600 hover:bg-slate-700 w-full sm:w-auto"
                        onClick={revertToDefaultFont}
                    />
                )}
            </div>
          </div>
           <div className="mt-6 flex flex-wrap gap-3 justify-center">
             <StyleButton
                label={isEditingPosition ? "Finalize Layout" : "Edit Text Layout"}
                colorClass={isEditingPosition ? "bg-pink-500 hover:bg-pink-600" : "bg-indigo-500 hover:bg-indigo-600"}
                onClick={toggleEditMode}
              />
           </div>
        </div>

        <div className="bg-slate-800 p-1 rounded-xl shadow-2xl relative overflow-hidden w-full">
           <div className="absolute inset-0 bg-checkerboard opacity-10 z-0" aria-hidden="true"></div>
          <h2 className="text-xl font-semibold my-2 ml-4 text-sky-400 relative z-10">Preview</h2>
          <div
            className="w-full aspect-[16/9] bg-transparent relative z-10"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="absolute inset-0 p-2 sm:p-4 overflow-hidden flex items-center justify-center"> {/* Centering content */}
              <div
                ref={draggableTextRef}
                className="text-3xl sm:text-4xl md:text-5xl whitespace-pre-wrap break-words text-center" // Changed to text-center
                style={{
                  fontFamily: getFontFamily(),
                  transform: `translate(${textPosition.x}px, ${textPosition.y}px) scale(${textScale})`,
                  transformOrigin: 'center',
                  cursor: isEditingPosition ? (isDragging ? 'grabbing' : (isResizing ? 'nwse-resize' : 'grab')) : 'default',
                  display: 'inline-block',
                  userSelect: isDragging || isResizing || isEditingPosition ? 'none' : 'auto',
                  touchAction: 'none',
                  position: 'relative',
                }}
                onMouseDown={handleMouseDown}
                role="textbox"
                aria-multiline="true"
                aria-label="Styled text preview"
              >
                <StyledTextDisplay segments={segmentsToRender} />
                {isEditingPosition && (
                  <div
                    style={resizeHandleStyle}
                    onMouseDown={handleResizeStart}
                    aria-label="Resize handle"
                    role="button"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>Crafted with React, Tailwind CSS, and TypeScript.</p>
        <p>Note: Complex text effects are approximations of Photoshop styles using CSS.</p>
      </footer>
       <style>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #4A5568 25%, transparent 25%), linear-gradient(-45deg, #4A5568 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4A5568 75%), linear-gradient(-45deg, transparent 75%, #4A5568 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        /* Ensure select dropdown text is visible */
        select option {
            background: #334155; /* slate-700 */
            color: #e2e8f0; /* slate-200 */
        }
      `}</style>
    </div>
  );
};

export default App;
