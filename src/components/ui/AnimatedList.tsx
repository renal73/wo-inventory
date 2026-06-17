'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedList({ children, className = '', staggerDelay = 0.08 }: AnimatedListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
export default AnimatedList;
