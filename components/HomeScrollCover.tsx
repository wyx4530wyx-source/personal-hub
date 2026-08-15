import type { ReactNode } from "react";

type HomeScrollCoverProps = {
  hero: ReactNode;
  children: ReactNode;
};

/**
 * Keeps the Home visual stage behind the page while the content panel rises over it.
 * The panel background rises with the panel, then becomes sticky at the viewport top.
 * All motion is driven by the browser's native scroll position.
 */
export function HomeScrollCover({ hero, children }: HomeScrollCoverProps) {
  return (
    <div className="home-scroll-cover">
      <div className="home-hero-stage">{hero}</div>
      <div className="home-content-panel">
        <div className="home-content-background" aria-hidden="true" />
        <div className="home-content-body">{children}</div>
      </div>
    </div>
  );
}
