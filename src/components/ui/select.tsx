"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/55 bg-gradient-to-b from-card/95 to-background/98 px-3.5 text-left text-sm font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(24,36,44,0.05)] ring-1 ring-border/15 transition-[box-shadow,border-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-[placeholder]:text-muted-foreground hover:border-border hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_10px_rgba(24,36,44,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45 data-[state=open]:border-primary/40 data-[state=open]:shadow-[0_0_0_1px_rgba(91,187,189,0.18),0_8px_28px_-6px_rgba(91,187,189,0.2),inset_0_1px_0_rgba(255,255,255,0.6)] [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/40 transition-[background-color,color,transform] duration-200 group-hover:bg-muted/80 group-data-[state=open]:bg-primary/12 group-data-[state=open]:text-primary group-data-[state=open]:ring-primary/20">
        <ChevronDown
          className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]:-rotate-180"
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1.5 text-muted-foreground transition-colors hover:text-foreground",
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4 opacity-70" strokeWidth={1.75} aria-hidden />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1.5 text-muted-foreground transition-colors hover:text-foreground",
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4 opacity-70" strokeWidth={1.75} aria-hidden />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[200] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border/50 bg-popover/98 text-popover-foreground shadow-[0_24px_56px_-16px_rgba(24,36,44,0.2),0_0_0_1px_rgba(24,36,44,0.04)] ring-1 ring-border/25 backdrop-blur-xl supports-[backdrop-filter]:bg-popover/92",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1.5 data-[side=top]:-translate-y-1.5 data-[side=left]:-translate-x-0.5 data-[side=right]:translate-x-0.5",
        className,
      )}
      position={position}
      sideOffset={6}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-y-auto overscroll-contain p-1.5",
          position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative mx-0.5 flex w-full min-w-0 cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm font-medium text-foreground outline-none transition-[background-color,box-shadow,color] duration-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      "data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-primary/[0.1] data-[highlighted]:to-primary/[0.02] data-[highlighted]:text-foreground data-[highlighted]:shadow-[inset_3px_0_0_0_var(--primary)]",
      "data-[state=checked]:bg-primary/[0.08] data-[state=checked]:font-semibold",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-md bg-background/80 ring-1 ring-border/40">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("my-1.5 h-px bg-gradient-to-r from-transparent via-border to-transparent", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
