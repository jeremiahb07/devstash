import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * Two letters for a name, one for a bare email address, nothing for neither.
 *
 * `Array.from` rather than `[0]` so a name starting with an astral character
 * (an emoji, say) yields that character instead of half a surrogate pair.
 */
export function getInitials(name?: string | null, email?: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (words.length >= 2) {
    const first = Array.from(words[0])[0];
    const last = Array.from(words[words.length - 1])[0];
    return `${first}${last}`.toUpperCase();
  }

  // A single-word name gives up its first two characters — "J" alone reads as
  // a placeholder next to the two-letter initials everyone else gets.
  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  }

  const localPart = email?.trim().split("@")[0];
  return localPart ? Array.from(localPart)[0].toUpperCase() : "";
}

/**
 * The user's GitHub picture when there is one, their initials when there
 * isn't. `AvatarImage` swaps itself out for the fallback if the URL fails to
 * load, so a dead image link degrades to initials rather than a blank circle.
 */
export function UserAvatar({
  name,
  email,
  image,
  size = "default",
  className,
}: UserAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt={name ?? email ?? "User avatar"} />}
      <AvatarFallback>
        {initials || <User className="size-1/2" aria-label="User avatar" />}
      </AvatarFallback>
    </Avatar>
  );
}
