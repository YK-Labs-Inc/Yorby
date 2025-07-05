import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const jobTitle = searchParams.get("jobTitle");

    if (!title || !jobTitle) {
      return new Response("Missing required parameters", { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
            padding: "80px 40px",
          }}
        >
          {/* Title Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "24px",
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 800,
                textAlign: "center",
                color: "black",
                lineHeight: 1.2,
                maxWidth: "90%",
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 32,
                color: "#4B5563",
                textAlign: "center",
                margin: 0,
              }}
            >
              Sample Resume Template for {jobTitle}
            </p>
          </div>

          {/* Logo at Bottom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "40px",
            }}
          >
            <img
              src={new URL("/assets/dark-logo.png", request.url).toString()}
              alt="Perfect Interview Logo"
              width="48"
              height="48"
            />
            <span
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "black",
              }}
            >
              Perfect Interview
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
