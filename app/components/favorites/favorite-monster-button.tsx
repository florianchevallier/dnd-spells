import { Star } from "lucide-react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface FavoriteMonsterButtonProps {
  monsterId: number;
  isFavorite: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "default";
  showLabel?: boolean;
  className?: string;
}

export function FavoriteMonsterButton({
  monsterId,
  isFavorite,
  isLoggedIn,
  size = "sm",
  showLabel = false,
  className,
}: FavoriteMonsterButtonProps) {
  const fetcher = useFetcher();

  const optimisticIsFavorite =
    fetcher.state !== "idle"
      ? fetcher.formData?.get("action") === "add" ||
        (fetcher.formData?.get("action") === "toggle" && !isFavorite)
      : isFavorite;

  const isDisabled = !isLoggedIn;
  const isLoading = fetcher.state !== "idle";

  const tooltipText = isDisabled
    ? "Connectez-vous pour ajouter des favoris"
    : optimisticIsFavorite
      ? "Retirer des favoris"
      : "Ajouter aux favoris";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) return;

    fetcher.submit(
      {
        monsterId: monsterId.toString(),
        action: "toggle",
      },
      {
        method: "POST",
        action: "/api/favorite-monsters",
      }
    );
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={cn(
        "transition-all",
        size === "sm" && "h-7 w-7",
        optimisticIsFavorite && "text-amber-400 hover:text-amber-300",
        !optimisticIsFavorite && "text-stone-500 hover:text-stone-300",
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
          optimisticIsFavorite && "fill-current"
        )}
      />
      {showLabel && (
        <span className="ml-1">{optimisticIsFavorite ? "Favori" : "Favori"}</span>
      )}
    </Button>
  );
}
