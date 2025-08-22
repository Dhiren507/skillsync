import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Primary Gradient Orbs */}
      <motion.div 
        className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        style={{ left: '10%', top: '15%' }}
        animate={{ 
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        style={{ right: '10%', bottom: '15%' }}
        animate={{ 
          x: [0, -40, 0],
          y: [0, 25, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Secondary Accent Orbs */}
      <motion.div 
        className="absolute w-64 h-64 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full blur-2xl"
        style={{ left: '60%', top: '25%' }}
        animate={{ 
          x: [0, -25, 0],
          y: [0, 15, 0],
          scale: [1, 0.9, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, 
          backgroundSize: '50px 50px' 
        }} 
      />
      
      {/* Light Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/20 opacity-30" />
      
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/30 rounded-full"
          style={{
            left: `${20 + (i * 15)}%`,
            top: `${30 + (i * 10)}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
