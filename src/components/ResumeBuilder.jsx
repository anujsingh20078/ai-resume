import { useState } from "react";
import "../styles/build.css";

export default function ResumeBuilder() {
  const [formData, setFormData] = useState({
    apiKey: "",
    resumeType: "software",
    personalInfo: "",
    education: "",
    experience: "",
    projects: "",
    skills: "",
    extracurriculars: "",
  });

  const [loading, setLoading] = useState(false);
  const [resumeHTML, setResumeHTML] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleGenerate = async () => {
    const {
      apiKey,
      resumeType,
      personalInfo,
      education,
      experience,
      projects,
      skills,
      extracurriculars,
    } = formData;

    if (!apiKey) {
      alert("Please enter your Gemini API key!");
      return;
    }

    if (!personalInfo || !education || !experience || !skills) {
      alert("Please fill required fields.");
      return;
    }

    setLoading(true);

    const prompt = `
You are a professional resume builder that creates resumes strictly in HTML format.

Resume Type:
${resumeType}

Personal Information:
${personalInfo}

Education:
${education}

Experience:
${experience}

Projects:
${projects}

Skills:
${skills}

Extracurriculars:
${extracurriculars}

CRITICAL:
- Output clean HTML only
- No markdown
- No <html>, <head>, <body>
`;

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API error");
      }

      const data = await response.json();
      const rawHTML =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No content generated.";

      const cleanHTML = rawHTML
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .trim();

      setResumeHTML(cleanHTML);
    } catch (error) {
      alert("Error generating resume: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resumeHTML) {
      alert("Generate a resume first!");
      return;
    }
    window.print();
  };

  const handleCopy = () => {
    if (!resumeHTML) {
      alert("Generate a resume first!");
      return;
    }

    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Resume</title>
</head>
<body>
${resumeHTML}
</body>
</html>
`;

    navigator.clipboard.writeText(fullHTML);
    alert("Full HTML copied!");
  };

  return (
    <div className="container">
      <div className="panel">
        <h1>AI Resume Builder</h1>

        <div className="api-key-group">
          <label>Gemini API Key *</label>
          <input
            type="password"
            id="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Resume Type</label>
          <select
            id="resumeType"
            value={formData.resumeType}
            onChange={handleChange}
          >
            <option value="software">Software Engineer</option>
            <option value="data">Data Scientist</option>
            <option value="product">Product Manager</option>
            <option value="marketing">Marketing Manager</option>
            <option value="designer">UI/UX Designer</option>
          </select>
        </div>

        {[
          { label: "Personal Information", id: "personalInfo" },
          { label: "Education", id: "education" },
          { label: "Experience", id: "experience" },
          { label: "Projects", id: "projects" },
          { label: "Skills", id: "skills" },
          { label: "Extracurriculars", id: "extracurriculars" },
        ].map((field) => (
          <div className="form-group" key={field.id}>
            <label>{field.label}</label>
            <textarea
              id={field.id}
              value={formData[field.id]}
              onChange={handleChange}
            />
          </div>
        ))}

        <button
          className="btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Resume"}
        </button>

        {loading && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Generating your professional resume...</p>
          </div>
        )}
      </div>

      <div className="panel">
        <h1>Resume Preview</h1>

        <div
          id="resumePreview"
          dangerouslySetInnerHTML={{
            __html:
              resumeHTML ||
              `<p style="text-align:center;color:#999;margin-top:100px">
              Fill out the form and click Generate.
            </p>`,
          }}
        />

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleDownload}>
            Download PDF
          </button>
          <button className="btn" onClick={handleCopy}>
            Copy HTML
          </button>
        </div>
      </div>
    </div>
  );
}