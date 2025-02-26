import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Logger } from "next-axiom";

const logger = new Logger().with({
  route: "/api/resume/download",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ResumeSection {
  title: string;
  content: any[];
}

interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary: string;
  sections: ResumeSection[];
}

export async function POST(req: NextRequest) {
  try {
    const { resume } = await req.json();

    if (!resume) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      );
    }

    logger.info("Generating PDF from resume data");

    // Create HTML content from resume data
    const htmlContent = generateResumeHtml(resume);

    // Use OpenAI's text-to-image API to create an image of the rendered HTML
    // This is a workaround since we don't have direct access to a PDF library in this serverless environment
    const response = await fetch(
      "https://playground.embedded.io/api/html-to-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
      }
    );

    if (!response.ok) {
      throw new Error(`PDF generation service error: ${response.status}`);
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    logger.info("PDF generated successfully");
    await logger.flush();

    // Return the PDF blob
    return new Response(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resume.name.replace(/\s+/g, "_")}_Resume.pdf"`,
      },
    });
  } catch (error) {
    logger.error("Error generating PDF", { error });
    await logger.flush();
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function generateResumeHtml(resume: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${resume.name} - Resume</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Open Sans', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 10pt;
        }
        
        .container {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
        }
        
        header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 18pt;
          margin: 0;
          color: #2d3748;
        }
        
        .contact-info {
          font-size: 10pt;
          color: #4a5568;
          margin-top: 5px;
        }
        
        section {
          margin-bottom: 20px;
        }
        
        h2 {
          font-size: 12pt;
          color: #2d3748;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        .section-content {
          margin-left: 0;
        }
        
        .experience-item, .education-item {
          margin-bottom: 15px;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .item-title {
          font-weight: 700;
        }
        
        .item-date {
          color: #718096;
        }
        
        .item-org {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .item-description {
          margin-top: 5px;
          color: #4a5568;
        }
        
        ul {
          margin-top: 5px;
          margin-bottom: 5px;
          padding-left: 20px;
        }
        
        li {
          margin-bottom: 3px;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          margin-top: 5px;
          gap: 8px;
        }
        
        .skill-item {
          background-color: #f7fafc;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          font-size: 9pt;
          display: inline-block;
        }
        
        @media print {
          body {
            width: 8.5in;
            height: 11in;
            margin: 0;
            padding: 0;
          }
          
          .container {
            padding: 0.5in;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${resume.name}</h1>
          <div class="contact-info">
            ${resume.email}
            ${resume.phone ? ` | ${resume.phone}` : ""}
            ${resume.location ? ` | ${resume.location}` : ""}
          </div>
        </header>
        
        <section>
          <h2>Professional Summary</h2>
          <div class="section-content">
            <p>${resume.summary}</p>
          </div>
        </section>
        
        ${resume.sections
          .map((section: ResumeSection) => {
            if (section.title.toLowerCase().includes("skill")) {
              return `
              <section>
                <h2>${section.title}</h2>
                <div class="skills-list">
                  ${section.content
                    .map(
                      (skill: string) => `
                    <span class="skill-item">${skill}</span>
                  `
                    )
                    .join("")}
                </div>
              </section>
            `;
            } else {
              return `
              <section>
                <h2>${section.title}</h2>
                <div class="section-content">
                  ${section.content
                    .map(
                      (item: any) => `
                    <div class="${section.title.toLowerCase().includes("experience") ? "experience-item" : "education-item"}">
                      ${item.title ? `<div class="item-title">${item.title}</div>` : ""}
                      ${
                        item.organization
                          ? `
                        <div class="item-org">
                          <span>${item.organization}</span>
                          ${item.date ? `<span class="item-date">${item.date}</span>` : ""}
                        </div>
                      `
                          : ""
                      }
                      ${
                        item.description
                          ? `
                        <div class="item-description">
                          ${
                            typeof item.description === "string"
                              ? `<p>${item.description}</p>`
                              : `
                              <ul>
                                ${Array.isArray(item.description) ? item.description.map((point: string) => `<li>${point}</li>`).join("") : ""}
                              </ul>
                            `
                          }
                        </div>
                      `
                          : ""
                      }
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </section>
            `;
            }
          })
          .join("")}
      </div>
    </body>
    </html>
  `;
}
