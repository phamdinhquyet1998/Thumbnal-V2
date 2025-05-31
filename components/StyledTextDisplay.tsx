
import React from 'react';
import { TextSegment, StyleKey } from '../types';

interface StyledTextDisplayProps {
  segments: TextSegment[];
}

const getStyleClassName = (styleKey: StyleKey): string => {
  switch (styleKey) {
    case 'yellow':
      return 'text-effect-yellow has-drop-shadow';
    case 'red':
      return 'text-effect-red has-drop-shadow';
    case 'blue':
      return 'text-effect-blue has-drop-shadow';
    case 'none':
    default:
      return 'text-effect-none'; 
  }
};

const StyledTextDisplay: React.FC<StyledTextDisplayProps> = ({ segments }) => {
  if (!segments || segments.length === 0) {
    // The parent div (Container C in App.tsx) will handle font-family and base styling.
    // This component now focuses only on applying color/effect classes per segment.
    return <span className="styled-text-base text-effect-none">(Empty)</span>;
  }
  
  return (
    // The font-family is now set on the draggable parent div in App.tsx.
    // styled-text-base class will inherit this font-family.
    <>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={`styled-text-base ${getStyleClassName(segment.styleKey)}`}
          // font-family is inherited
        >
          {segment.text}
        </span>
      ))}
    </>
  );
};

export default StyledTextDisplay;
