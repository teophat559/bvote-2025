import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';
import { motion } from 'framer-motion';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-lg text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
				destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20',
				outline:
          'border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
				secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
        glow: 'bg-gradient-to-br from-primary to-highlight text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:brightness-110'
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-12 rounded-xl px-8 text-base',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? motion(Slot) : motion.button;
	return (
		<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      whileHover={{ 
        scale: 1.03,
        y: -2,
        boxShadow: "0 8px 25px hsla(var(--primary), 0.4)",
        transition: { type: 'spring', stiffness: 300, damping: 15 } 
      }}
      whileTap={{ 
        scale: 0.98,
        y: 0,
        boxShadow: "0 2px 10px hsla(var(--primary), 0.25)",
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      }}
      {...props}
    />
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };