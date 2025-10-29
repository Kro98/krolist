import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const undertoneColors: Record<string, string> = {
  orange: '31 98% 51%',
  blue: '217 91% 59%',
  green: '142 71% 45%',
  purple: '271 81% 56%',
  red: '0 84% 60%',
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme, undertone } = useTheme();

  return (
    <Sonner
      theme={actualTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          '--action-button-bg': `hsl(${undertoneColors[undertone]})`,
        } as React.CSSProperties,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
