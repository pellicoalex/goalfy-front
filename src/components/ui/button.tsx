import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const buttonVariants = cva(
  [
    // base
    "inline-flex items-center justify-center whitespace-nowrap select-none",
    "rounded-md border border-transparent bg-clip-padding text-sm font-semibold",
    "transition-all disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
    "group/button outline-none shrink-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /**
         *  GOALFY primary
         */
        default: cn(
          "bg-secondary text-[#FBFAFA] shadow-sm",
          "hover:bg-secondary/90 active:bg-secondary/85",
          "focus-visible:ring-secondary/25",
        ),

        /**
         *  GOALFY outline
         */
        outline: cn(
          "border-[#2B5492]/30 bg-white text-primary",
          "hover:bg-[#02A0DD]/10 hover:border-primary/40",
          "active:bg-secondary/15",
          "focus-visible:ring-primary/15",
          "shadow-xs",
          "dark:text-secondary",
          "dark:border-secondary",
          "dark:hover:text-white",
          "dark:hover:border-white",
          "dark:hover:bg-secondary",
        ),

        /**
         *  GOALFY secondary (soft)
         */
        secondary: cn(
          "bg-secondary/12 text-primary border border-secondary/20",
          "hover:bg-secondary/18 hover:border-secondary/25",
          "active:bg-secondary/22",
          "focus-visible:ring-secondary/18",
        ),

        /**
         *  GOALFY ghost (minimal)
         */
        ghost: cn(
          "bg-transparent text-primary",
          "hover:bg-secondary/10",
          "active:bg-secondary/15",
          "focus-visible:ring-secondary/18",
        ),

        /**
         * Destructive
         */
        destructive: cn(
          "bg-destructive/10 hover:bg-destructive/20 text-destructive",
          "focus-visible:ring-destructive/20 focus-visible:border-destructive/40",
          "dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
          "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        ),

        /**
         *  GOALFY link
         */
        link: cn(
          "border-transparent bg-transparent p-0 h-auto",
          "text-primary underline-offset-4 hover:underline",
          "hover:text-primary/90",
          "focus-visible:ring-primary/15",
        ),
      },

      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: cn(
          "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        sm: cn(
          "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5",
          "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        ),
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",

        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[min(var(--radius-md),10px)]",
        "icon-lg": "size-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

const MotionButton = motion(Button);

export { Button, buttonVariants, MotionButton };
