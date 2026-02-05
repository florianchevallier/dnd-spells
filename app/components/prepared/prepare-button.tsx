import { useFetcher } from "react-router";
import { Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface PrepareButtonProps {
  spellId: number;
  characterId: number | null;
  isPrepared: boolean;
  size?: "sm" | "default";
  showLabel?: boolean;
  className?: string;
}

export function PrepareButton({
  spellId,
  characterId,
  isPrepared,
  size = "sm",
  showLabel = false,
  className,
}: PrepareButtonProps) {
  const fetcher = useFetcher();

  // Optimistic UI: use the pending state if we're submitting
  const optimisticIsPrepared =
    fetcher.state !== "idle"
      ? fetcher.formData?.get("action") === "add" ||
        (fetcher.formData?.get("action") === "toggle" && !isPrepared)
      : isPrepared;

  const isDisabled = !characterId;
  const isLoading = fetcher.state !== "idle";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the button

    if (!characterId) return;

    fetcher.submit(
      {
        characterId: characterId.toString(),
        spellId: spellId.toString(),
        action: "toggle",
      },
      {
        method: "POST",
        action: "/api/prepared-spells",
      }
    );
  };

  const tooltipText = isDisabled
    ? "Selectionnez un personnage pour preparer des sorts"
    : optimisticIsPrepared
      ? "Retirer des sorts prepares"
      : "Preparer ce sort";

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={cn(
        "transition-all",
        size === "sm" && "h-7 w-7",
        optimisticIsPrepared && "text-amber-400 hover:text-amber-300",
        !optimisticIsPrepared && "text-stone-500 hover:text-stone-300",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      aria-label={tooltipText}
      title={tooltipText}
    >
      <Star
        className={cn(
          "transition-all",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          optimisticIsPrepared && "fill-current"
        )}
      />
      {showLabel && (
        <span className="ml-1">
          {optimisticIsPrepared ? "Sort prepare" : "Preparer"}
        </span>
      )}
    </Button>
  );
}
