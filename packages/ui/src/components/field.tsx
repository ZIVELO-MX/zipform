"use client";

import { useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Separator } from "./separator";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn("flex flex-col gap-6", className)} {...props} />;
}

function FieldLegend({ className, variant = "legend", ...props }: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return <legend data-slot="field-legend" data-variant={variant} className={cn("mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm", className)} {...props} />;
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("group/field-group flex w-full flex-col gap-5 [&>[data-slot=field-group]]:gap-4", className)} {...props} />;
}

const fieldVariants = cva("group/field flex w-full gap-2.5 data-[invalid=true]:text-zivelo", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
      horizontal: "flex-row items-center [&>[data-slot=field-label]]:flex-auto",
      responsive: "flex-col [&>*]:w-full [&>.sr-only]:w-auto md:flex-row md:items-center md:[&>*]:w-auto md:[&>[data-slot=field-label]]:flex-auto"
    }
  },
  defaultVariants: { orientation: "vertical" }
});

function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />;
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn("flex flex-1 flex-col gap-1.5 leading-snug", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn("flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50", className)} {...props} />;
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-label" className={cn("flex w-fit items-center gap-2 text-sm font-medium leading-snug", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-sm font-normal leading-normal text-carbon/55", className)} {...props} />;
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div data-slot="field-separator" data-content={!!children} className={cn("relative h-5 text-sm", className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children ? <span className="relative mx-auto block w-fit bg-paper px-2 text-carbon/45">{children}</span> : null}
    </div>
  );
}

function FieldError({ className, children, errors, ...props }: React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> }) {
  const content = useMemo(() => {
    if (children) return children;
    if (!errors) return null;
    if (errors.length === 1) return errors[0]?.message;
    return <ul className="ml-4 flex list-disc flex-col gap-1">{errors.map((error, index) => error?.message ? <li key={index}>{error.message}</li> : null)}</ul>;
  }, [children, errors]);

  if (!content) return null;
  return <div role="alert" data-slot="field-error" className={cn("text-sm font-normal text-zivelo", className)} {...props}>{content}</div>;
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle };
