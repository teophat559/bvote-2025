import { cn } from '@/lib/utils';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';
import React from 'react';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Viewport
		ref={ref}
		className={cn(
			'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-auto sm:right-0 sm:top-4 sm:flex-col md:max-w-[420px]',
			className,
		)}
		{...props}
	/>
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
	'data-[swipe=move]:transition-none group relative pointer-events-auto flex w-full items-center space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-top-full data-[state=closed]:slide-out-to-right-full',
	{
		variants: {
			variant: {
				default: 'bg-background border text-foreground',
				destructive: 'group destructive border-red-600 bg-red-600 text-white',
        success: 'group success border-green-600 bg-green-600 text-white',
        info: 'group info border-blue-600 bg-blue-600 text-white',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
	const Icon = 
    variant === 'destructive' ? XCircle :
    variant === 'success' ? CheckCircle :
    variant === 'info' ? Info :
    null;

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {Icon && <Icon className="h-6 w-6" />}
      <div className="flex-1">{props.children}</div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Action
		ref={ref}
		className={cn(
			'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
			'group-[.destructive]:border-transparent group-[.destructive]:hover:bg-red-700 group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-red-500',
      'group-[.success]:border-transparent group-[.success]:hover:bg-green-700 group-[.success]:hover:text-white group-[.success]:focus:ring-green-500',
      'group-[.info]:border-transparent group-[.info]:hover:bg-blue-700 group-[.info]:hover:text-white group-[.info]:focus:ring-blue-500',
			className
		)}
		{...props}
	/>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Close
		ref={ref}
		className={cn(
			'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
			'group-[.destructive]:text-red-300 group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      'group-[.success]:text-green-300 group-[.success]:hover:text-white group-[.success]:focus:ring-green-400 group-[.success]:focus:ring-offset-green-600',
      'group-[.info]:text-blue-300 group-[.info]:hover:text-white group-[.info]:focus:ring-blue-400 group-[.info]:focus:ring-offset-blue-600',
			className,
		)}
		toast-close=""
		{...props}
	>
		<X className="h-4 w-4" />
	</ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Title
		ref={ref}
		className={cn('text-sm font-semibold', className)}
		{...props}
	/>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Description
		ref={ref}
		className={cn('text-sm opacity-90', className)}
		{...props}
	/>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
	Toast,
	ToastAction,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
};