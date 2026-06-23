import Link from "next/link";
import { Compass, Home, ScrollText } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found-mark">
        <Compass size={38} />
      </div>
      <p className="eyebrow">404</p>
      <h2>Page not found</h2>
      <p>The route is not part of the Zipform platform map yet.</p>
      <div className="not-found-actions">
        <Link className="button-link" href="/">
          <Home size={17} />
          Dashboard
        </Link>
        <Link className="button-link secondary" href="/roadmap">
          <ScrollText size={17} />
          Roadmap
        </Link>
      </div>
    </section>
  );
}
