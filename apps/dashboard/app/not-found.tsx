import Link from "next/link";
import { Compass, Home, FolderKanban } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found-mark">
        <Compass size={38} />
      </div>
      <p className="text-xs font-semibold text-carbon/60">Error 404</p>
      <h1 className="m-0 text-lg font-bold">Página no encontrada</h1>
      <p>La ruta no pertenece al mapa de documentos de TLOZ.</p>
      <div className="not-found-actions">
        <Link className="button-link" href="/">
          <Home size={17} />
          Lobby
        </Link>
        <Link className="button-link secondary" href="/projects">
          <FolderKanban size={17} />
          Projects
        </Link>
      </div>
    </section>
  );
}
