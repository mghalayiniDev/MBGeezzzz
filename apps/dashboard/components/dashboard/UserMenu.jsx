import { LogoutButton } from "./LogoutButton";

// Receives the already-verified user from the dashboard layout.
export function UserMenu({ user }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2.5">
        {user.image ? (
          // Discord CDN avatar. Plain <img>: no image-optimizer cost, and no referrer sent to Discord.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" width={32} height={32} referrerPolicy="no-referrer" className="size-8 rounded-full" />
        ) : (
          <span className="size-8 rounded-full bg-brand/60" aria-hidden="true" />
        )}
        <span className="hidden max-w-48 truncate text-sm font-medium text-fg sm:inline">{user.name}</span>
      </span>
      <LogoutButton />
    </div>
  );
}
