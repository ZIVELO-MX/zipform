import { NextResponse } from "next/server";
import { auth } from "../../auth";

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Zipform Data API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html, body { margin: 0; padding: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    #swagger-ui { max-width: 1460px; margin: 0 auto; padding: 16px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/openapi",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      requestInterceptor: (req) => {
        req.credentials = "include";
        return req;
      },
    });
  </script>
</body>
</html>`;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  return new NextResponse(SWAGGER_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
