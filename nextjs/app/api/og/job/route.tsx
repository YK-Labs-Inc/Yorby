import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobTitle = searchParams.get("title") || "Join Our Team";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {/* Left side - Blue background with Yorby */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "50%",
              height: "100%",
              background: "#2563eb",
            }}
          >
            <div
              style={{
                fontSize: "120px",
                fontWeight: "bold",
                color: "white",
                letterSpacing: "-0.025em",
              }}
            >
              Yorby
            </div>
          </div>

          {/* Right side - White background with job title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              width: "50%",
              height: "100%",
              background: "white",
              paddingLeft: "60px",
              paddingRight: "60px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: "#2563eb",
                lineHeight: "1.1",
                marginBottom: "20px",
                textAlign: "left",
                maxWidth: "100%",
                wordWrap: "break-word",
              }}
            >
              {jobTitle}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "600",
                color: "#2563eb",
                opacity: 0.8,
              }}
            >
              Apply Now →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
