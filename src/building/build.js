// ==========================================
// CONFIGURATION
// ==========================================
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ==========================================
// DOM ELEMENTS
// ==========================================
const generateBtn = document.getElementById("generateBtn");
const addExpBtn = document.getElementById("addExpBtn");
const addProjBtn = document.getElementById("addProjBtn");
const addCustomBtn = document.getElementById("addCustomBtn");

const expContainer = document.getElementById("experienceContainer");
const projContainer = document.getElementById("projectsContainer");
const customContainer = document.getElementById("customContainer");
const resumePreview = document.getElementById("resumePreview");

// Helper: Attach remove event
function attachRemoveEvent(cardElement) {
  const removeBtn = cardElement.querySelector(".remove-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", function () {
      cardElement.remove();
    });
  }
}

// 1. Add Experience
if (addExpBtn) {
  addExpBtn.addEventListener("click", function () {
    const card = document.createElement("div");
    card.className = "card premium-card dynamic-card";

    card.innerHTML = `
      <button type="button" class="remove-btn">Remove</button>
      <div class="input-grid">
        <div class="input-group">
          <label>Job Title & Company</label>
          <input type="text" class="exp-title" placeholder="SDE Intern at Google">
        </div>
        <div class="input-group">
          <label>Duration</label>
          <input type="text" class="exp-dates" placeholder="May 2025 - July 2025">
        </div>
        <div class="input-group full-width">
          <label>Key Responsibilities</label>
          <textarea class="exp-desc" rows="3" placeholder="- Developed XYZ feature..."></textarea>
        </div>
      </div>
    `;
    expContainer.appendChild(card);
    attachRemoveEvent(card);
  });
}

// 2. Add Project
if (addProjBtn) {
  addProjBtn.addEventListener("click", function () {
    const card = document.createElement("div");
    card.className = "card premium-card dynamic-card";

    card.innerHTML = `
      <button type="button" class="remove-btn">Remove</button>
      <div class="input-grid">
        <div class="input-group">
          <label>Project Name</label>
          <input type="text" class="proj-title" placeholder="Aura-chat">
        </div>
        <div class="input-group">
          <label>Tech Stack</label>
          <input type="text" class="proj-tech" placeholder="React, Node.js">
        </div>
        <div class="input-group full-width">
          <label>Description</label>
          <textarea class="proj-desc" rows="3" placeholder="- Built a real-time chat app..."></textarea>
        </div>
      </div>
    `;
    projContainer.appendChild(card);
    attachRemoveEvent(card);
  });
}

// 3. Add Custom Section
if (addCustomBtn) {
  addCustomBtn.addEventListener("click", function () {
    const card = document.createElement("div");
    card.className = "card premium-card dynamic-card";

    card.innerHTML = `
      <button type="button" class="remove-btn">Remove</button>
      <div class="input-grid">
        <div class="input-group full-width">
          <label>Section Title</label>
          <input type="text" class="custom-title" placeholder="Certifications">
        </div>
        <div class="input-group full-width">
          <label>Details</label>
          <textarea class="custom-desc" rows="2" placeholder="AWS Certified Solutions Architect..."></textarea>
        </div>
      </div>
    `;
    customContainer.appendChild(card);
    attachRemoveEvent(card);
  });
}

// ==========================================
// API CALL & GENERATION
// ==========================================

if (generateBtn) {
  generateBtn.addEventListener("click", async function () {
    if (!apiKey) {
      alert("API Key missing! Make sure your .env file is set up correctly.");
      return;
    }

    const fullName = document.getElementById("fullName").value.trim();
    if (!fullName) {
      alert("Please provide at least your Full Name.");
      document.getElementById("fullName").focus();
      return;
    }

    // GATHER ALL INPUTS
    const targetRole = document.getElementById("targetRole").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const location = document.getElementById("location").value.trim();
    const links = document.getElementById("links").value.trim();
    const uniName = document.getElementById("uniName").value.trim();
    const degree = document.getElementById("degree").value.trim();
    const gradDate = document.getElementById("gradDate").value.trim();
    const cgpa = document.getElementById("cgpa").value.trim();
    const skills = document.getElementById("skills").value.trim();

    const originalBtnContent = this.innerHTML;
    this.innerHTML = `<svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg> Generating AI Resume...`;
    this.disabled = true;

    // GATHER DYNAMIC CARDS
    let experienceText = "";
    expContainer.querySelectorAll(".dynamic-card").forEach(card => {
      const t = card.querySelector(".exp-title").value.trim();
      const d = card.querySelector(".exp-dates").value.trim();
      const desc = card.querySelector(".exp-desc").value.trim();
      if (t || desc) experienceText += `Title/Company: ${t}\nDates: ${d}\nDesc:\n${desc}\n\n`;
    });

    let projectsText = "";
    projContainer.querySelectorAll(".dynamic-card").forEach(card => {
      const t = card.querySelector(".proj-title").value.trim();
      const tc = card.querySelector(".proj-tech").value.trim();
      const desc = card.querySelector(".proj-desc").value.trim();
      if (t || desc) projectsText += `Project: ${t}\nTech: ${tc}\nDesc:\n${desc}\n\n`;
    });

    let customText = "";
    customContainer.querySelectorAll(".dynamic-card").forEach(card => {
      const t = card.querySelector(".custom-title").value.trim();
      const desc = card.querySelector(".custom-desc").value.trim();
      if (t || desc) customText += `Section: ${t}\nDetails:\n${desc}\n\n`;
    });

    // PROMPT WITH CORRECT VARIABLES
    const prompt = `
You are an expert Resume Designer and ATS-optimizer. Generate a highly professional, premium resume STRICTLY in HTML format with embedded CSS.

Generate a resume tailored to the "${targetRole}" role using the following information:

Personal Information:
Name: ${fullName}
Contact: ${email} | ${phone} | ${location}
Links: ${links}

Education:
${degree} at ${uniName} (Graduation: ${gradDate}) | CGPA/Percentage: ${cgpa}

Experience:
${experienceText || "None Provided"}

Projects:
${projectsText || "None Provided"}

Skills:
${skills || "None Provided"}

Extra Sections / Extracurriculars:
${customText || "None Provided"}

CRITICAL REQUIREMENTS:
1. Output must be raw HTML ONLY (NO markdown formatting, NO \`\`\`html blocks).
2. Do NOT include <html>, <head>, or <body> tags. Output only the inner content.
3. You MUST start the output with a <style> block containing the CSS below, followed by the <div class="resume-wrapper">.

PREMIUM CSS & DESIGN RULES (You must write CSS for these classes):
- Font-family: 'Inter', Helvetica, Arial, sans-serif. Main Text Color: #1e293b.
- .resume-wrapper: Set standard padding (e.g., 20px), clean background.
- .resume-header: Center aligned, border-bottom 1px solid #cbd5e1; padding-bottom 16px; margin-bottom 20px.
- .resume-name: Font size 32px, uppercase, font-weight 800, color: #0f172a, letter-spacing 1px.
- .resume-contact: Font size 13px, color: #475569, margin-top 6px. Display as inline-flex with gap, separated by a bullet (•).
- .resume-section-title: Font size 16px, uppercase, font-weight 700, color: #2563eb (Royal Blue), border-bottom 2px solid #bfdbfe, padding-bottom 4px, margin-top 24px, margin-bottom 12px.
- .resume-item-header: MUST use display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px.
- .item-title: font-weight: bold; color: #0f172a; font-size: 15px. (Use for Job Titles, Project Names, University).
- .item-date: font-size: 13px; color: #64748b; font-weight: 600; text-align: right.
- .item-subtitle: font-style: italic; color: #475569; font-size: 14px; margin-bottom: 8px. (Use for Company Names, Tech Stack, Degree).
- .resume-list: padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 16px.
- .skill-label: font-weight: 700; color: #0f172a.

HTML STRUCTURE RULES:
- Apply the exact CSS classes mentioned above.
- Ensure Dates are ALWAYS on the far right using the flexbox item-header.
- Keep it concise, ATS-friendly, and format descriptions strictly as bullet points using action verbs.
`;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      let html = data.candidates?.[0]?.content?.parts?.[0]?.text || "<p>Error generating content.</p>";
      
      // Clean up markdown syntax if AI still outputs it
      html = html.replace(/```html/g, "").replace(/```/g, "").trim();

      resumePreview.innerHTML = html;
      resumePreview.classList.remove("empty-state");

      // Mobile auto-scroll to preview after generation
      if (window.innerWidth <= 1024) {
        document.querySelector('.preview-pane').scrollIntoView({ behavior: 'smooth' });
      }

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      this.innerHTML = originalBtnContent;
      this.disabled = false;
    }
  });
}

// ==========================================
// SMART RESIZABLE PANES (DRAG TO RESIZE)
// ==========================================
const resizer = document.getElementById('dragMe');
const appContainer = document.querySelector('.app-container');

let isDragging = false;

if (resizer && appContainer) {
  resizer.addEventListener('mousedown', function (e) {
    isDragging = true;
    resizer.classList.add('dragging');
    document.body.classList.add('is-resizing'); // Prevent text selection
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;

    // Disable resize logic on mobile screens
    if (window.innerWidth <= 1024) return;

    let newWidth = e.clientX;

    // Minimum and Maximum width constraints
    const minWidth = 350; 
    const maxWidth = window.innerWidth - 450; 

    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    appContainer.style.setProperty('--editor-width', `${newWidth}px`);
  });

  document.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      resizer.classList.remove('dragging');
      document.body.classList.remove('is-resizing');
    }
  });
}

// ==========================================
// PRINT (DOWNLOAD PDF)
// ==========================================
document.getElementById("printBtn")?.addEventListener("click", () => {
  if (resumePreview.querySelector(".empty-state")) return alert("Generate resume first!");
  window.print();
});