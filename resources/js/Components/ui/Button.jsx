import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils'; // Adjust path as needed

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default: 'bg-[#304d7d] text-white hover:bg-[#304d7d]/90', // Using the primary color from dubhemerak
                destructive:
                    'bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600/20',
                outline:
                    'border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900',
                secondary:
                    'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
                ghost:
                    'hover:bg-slate-100 hover:text-slate-900',
                link: 'text-slate-900 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'; // Simple fallback for asChild if Slot is missing
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button, buttonVariants };
