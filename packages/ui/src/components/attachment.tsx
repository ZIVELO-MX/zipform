"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Button } from "./button";

const attachmentVariants = cva(
  "group/attachment relative flex min-w-0 overflow-hidden rounded-[8px] border border-carbon/10 bg-paper text-carbon transition-colors focus-within:border-zivelo/45 hover:border-carbon/20 hover:bg-carbon/[0.03] data-[state=error]:border-zivelo/35 data-[state=error]:bg-tintred/60",
  {
    variants: {
      size: {
        default: "gap-3 p-3",
        sm: "gap-2.5 p-2.5",
        xs: "gap-2 p-2"
      },
      orientation: {
        horizontal: "items-center",
        vertical: "w-48 flex-col items-start"
      }
    },
    defaultVariants: {
      size: "default",
      orientation: "horizontal"
    }
  }
);

const attachmentMediaVariants = cva(
  "relative z-20 grid shrink-0 place-items-center overflow-hidden rounded-[7px] bg-carbon/5 text-carbon/70 pointer-events-none group-data-[state=error]/attachment:bg-zivelo/10 group-data-[state=error]/attachment:text-zivelo [&>svg]:size-4",
  {
    variants: {
      size: {
        default: "size-10",
        sm: "size-9",
        xs: "size-7"
      },
      variant: {
        icon: "",
        image: "bg-carbon/10 [&>img]:size-full [&>img]:object-cover"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "icon"
    }
  }
);

type AttachmentContextValue = {
  size: NonNullable<VariantProps<typeof attachmentVariants>["size"]>;
};

const AttachmentContext = React.createContext<AttachmentContextValue>({ size: "default" });

export interface AttachmentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof attachmentVariants> {
  state?: "idle" | "uploading" | "processing" | "error" | "done";
}

const Attachment = React.forwardRef<HTMLDivElement, AttachmentProps>(
  ({ className, state = "done", size = "default", orientation = "horizontal", ...props }, ref) => (
    <AttachmentContext.Provider value={{ size: size ?? "default" }}>
      <div
        ref={ref}
        data-state={state}
        data-size={size}
        data-orientation={orientation}
        className={cn(attachmentVariants({ size, orientation, className }))}
        {...props}
      />
    </AttachmentContext.Provider>
  )
);
Attachment.displayName = "Attachment";

export interface AttachmentMediaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof attachmentMediaVariants>, "size"> {}

const AttachmentMedia = React.forwardRef<HTMLDivElement, AttachmentMediaProps>(
  ({ className, variant = "icon", ...props }, ref) => {
    const { size } = React.useContext(AttachmentContext);

    return (
      <div ref={ref} className={cn(attachmentMediaVariants({ size, variant, className }))} {...props} />
    );
  }
);
AttachmentMedia.displayName = "AttachmentMedia";

const AttachmentContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("pointer-events-none relative z-20 min-w-0 flex-1 text-left", className)}
      {...props}
    />
  )
);
AttachmentContent.displayName = "AttachmentContent";

const AttachmentTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "truncate text-sm font-semibold leading-5 text-carbon group-data-[size=xs]/attachment:text-xs group-data-[state=processing]/attachment:animate-pulse group-data-[state=uploading]/attachment:animate-pulse group-data-[state=error]/attachment:text-zivelo",
        className
      )}
      {...props}
    />
  )
);
AttachmentTitle.displayName = "AttachmentTitle";

const AttachmentDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "m-0 truncate text-xs leading-4 text-carbon/55 group-data-[size=xs]/attachment:hidden group-data-[state=error]/attachment:text-zivelo/75",
        className
      )}
      {...props}
    />
  )
);
AttachmentDescription.displayName = "AttachmentDescription";

const AttachmentActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative z-30 ml-auto flex shrink-0 items-center gap-1", className)} {...props} />
  )
);
AttachmentActions.displayName = "AttachmentActions";

export interface AttachmentActionProps extends React.ComponentProps<typeof Button> {}

const AttachmentAction = React.forwardRef<HTMLButtonElement, AttachmentActionProps>(
  ({ variant = "ghost", size = "icon-xs", type = "button", className, ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      className={cn("rounded-[7px] text-carbon/65 hover:text-carbon", className)}
      {...props}
    />
  )
);
AttachmentAction.displayName = "AttachmentAction";

export interface AttachmentTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const AttachmentTrigger = React.forwardRef<HTMLButtonElement, AttachmentTriggerProps>(
  ({ asChild = false, className, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          "absolute inset-0 z-10 rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo",
          className
        )}
        {...props}
      />
    );
  }
);
AttachmentTrigger.displayName = "AttachmentTrigger";

const AttachmentGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap", className)}
      {...props}
    />
  )
);
AttachmentGroup.displayName = "AttachmentGroup";

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger
};
