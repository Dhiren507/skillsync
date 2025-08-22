import { FileText, Brain, ClipboardList, MessageSquare } from 'lucide-react';

export const TABS = [
  { key: 'notes', label: 'AI Notes', icon: FileText },
  { key: 'summary', label: 'Summary', icon: Brain },
  { key: 'quiz', label: 'Quiz', icon: ClipboardList },
  { key: 'desc', label: 'Description', icon: MessageSquare },
] as const;

export type TabKey = typeof TABS[number]['key'];

// Enhanced Custom Animation Styles
export const customStyles = `
  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.7;
      transform: scale(1);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.02);
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.85;
      transform: scale(1.02);
    }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in-left {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fade-in-right {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes shine {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  /* Hide scrollbars but maintain functionality */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.3);
    border-radius: 10px;
  }
  
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.5);
  }
  
  /* For Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
  }
  
  /* Hide scrollbars when hovering buttons */
  .video-controls-active .custom-scrollbar::-webkit-scrollbar {
    width: 0 !important;
    display: none !important;
  }
  
  /* Enhanced Button Animations */
  .video-btn-hover {
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
  }
  
  .video-btn-hover:after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: all 0.6s ease;
    z-index: 1;
  }
  
  .video-btn-hover:hover:after {
    left: 100%;
  }
  
  /* Video control button effects */
  .video-control-btn {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .video-control-btn:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
    transition: width 0.5s ease, height 0.5s ease;
  }
  
  .video-control-btn:hover:before {
    width: 300%;
    height: 300%;
  }
  
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 6s ease infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .animate-fade-in-left {
    animation: fade-in-left 0.6s ease-out forwards;
  }
  
  .animate-fade-in-right {
    animation: fade-in-right 0.6s ease-out forwards;
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-shine {
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
    background-size: 200px 100%;
    animation: shine 2s infinite;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .dark .glass-effect {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .gradient-border {
    position: relative;
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 1px;
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 1px;
    background: inherit;
    border-radius: 11px;
    background: var(--background-color);
  }
`;
