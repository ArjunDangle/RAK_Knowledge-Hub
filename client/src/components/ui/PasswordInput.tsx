// client/src/components/ui/PasswordInput.tsx
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const toggleVisibility = () => setIsPasswordVisible((prev) => !prev);

  return (
    <div className="relative">
      <Input
        type={isPasswordVisible ? "text" : "password"}
        className={cn("pr-10", className)} // Make space for the icon
        ref={ref}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-y-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
        onClick={toggleVisibility}
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
      >
        {isPasswordVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };