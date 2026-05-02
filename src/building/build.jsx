import React, { useState, useEffect, useRef } from 'react';
import './build.css'; // Apni CSS import karein

const Build= () => {
  // === STATE MANAGEMENT ===
  // 1. Personal Details
  const [personalInfo, setPersonalInfo] = useState({ fullName: '', targetRole: '', email: '', phone: '', location: '', links: '' });
  // 2. Education
  const [education, setEducation] = useState({ uniName: '', degree: '', gradDate: '', cgpa: '' });
  // 3. Skills
  const [skills, setSkills] = useState('');
  
  // 4. Dynamic Arrays (Experience, Projects, Custom Sections)
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customSections, setCustomSections] = useState([]);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  
  // Resizer State
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // === RESIZER LOGIC ===
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || window.innerWidth <= 1024) return;
      let newWidth = e.clientX;
      const minWidth = 350;
      const maxWidth = window.innerWidth - 450;

      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--editor-width', `${newWidth}px`);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.classList.remove('is-resizing');
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = () => {
    setIsResizing(true);
    document.body.classList.add('is-resizing');
  };

  // === HANDLERS FOR DYNAMIC FIELDS ===
  const addExperience = () => setExperiences([...experiences, { id: Date.now(), title: '', dates: '', desc: '' }]);
  const updateExperience = (id, field, value) => setExperiences(experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  const removeExperience = (id) => setExperiences(experiences.filter(exp => exp.id !== id));

  const addProject = () => setProjects([...projects, { id: Date.now(), title: '', tech: '', desc: '' }]);
  const updateProject = (id, field, value) => setProjects(projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj));
  const removeProject = (id) => setProjects(projects.filter(proj => proj.id !== id));

  const addCustom = () => setCustomSections([...customSections, { id: Date.now(), title: '', desc: '' }]);
  const updateCustom = (id, field, value) => setCustomSections(customSections.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
  const removeCustom = (id) => setCustomSections(customSections.filter(sec => sec.id !== id));

  // === GENERATE RESUME LOGIC ===
  const generateResume = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Ensure this is set in your .env file
    
    if (!apiKey) {
      alert("API Key missing! Make sure your .env file is set up correctly (VITE_GEMINI_API_KEY).");
      return;
    }
    if (!personalInfo.fullName) {
      alert("Please provide at least your Full Name.");
      return;
    }

    setIsGenerating(true);

    // Format Data for Prompt
    const expText = experiences.map(e => `Title/Company: ${e.title}\nDates: ${e.dates}\nDesc:\n${e.desc}\n`).join('\n');
    const projText = projects.map(p => `Project: ${p.title}\nTech: ${p.tech}\nDesc:\n${p.desc}\n`).join('\n');
    const customText = customSections.map(c => `Section: ${c.title}\nDetails:\n${c.desc}\n`).join('\n');

    const prompt = `
You are an expert Resume Designer and ATS-optimizer. Generate a highly professional, premium resume STRICTLY in HTML format with embedded CSS.

Generate a resume tailored to the "${personalInfo.targetRole}" role using the following information:

Personal Information:
Name: ${personalInfo.fullName}
Contact: ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
Links: ${personalInfo.links}

Education:
${education.degree} at ${education.uniName} (Graduation: ${education.gradDate}) | CGPA/Percentage: ${education.cgpa}

Experience:
${expText || "None Provided"}

Projects:
${projText || "None Provided"}

Skills:
${skills || "None Provided"}

Extra Sections / Extracurriculars:
${customText || "None Provided"}

CRITICAL REQUIREMENTS:
1. Output must be raw HTML ONLY (NO markdown formatting, NO \`\`\`html blocks).
2. Do NOT include <html>, <head>, or <body> tags. Output only the inner content.
3. You MUST start the output with a <style> block containing the CSS below, followed by the <div class="resume-wrapper">.

PREMIUM CSS & DESIGN RULES:
- Font-family: 'Inter', Helvetica, Arial, sans-serif. Main Text Color: #1e293b.
- .resume-wrapper: Set standard padding, clean background.
- .resume-header: Center aligned, border-bottom 1px solid #cbd5e1; padding-bottom 16px; margin-bottom 20px.
- .resume-name: Font size 32px, uppercase, font-weight 800, color: #0f172a, letter-spacing 1px.
- .resume-contact: Font size 13px, color: #475569, margin-top 6px. Display as inline-flex with gap, separated by a bullet (•).
- .resume-section-title: Font size 16px, uppercase, font-weight 700, color: #2563eb (Royal Blue), border-bottom 2px solid #bfdbfe, padding-bottom 4px, margin-top 24px, margin-bottom 12px.
- .resume-item-header: MUST use display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px.
- .item-title: font-weight: bold; color: #0f172a; font-size: 15px.
- .item-date: font-size: 13px; color: #64748b; font-weight: 600; text-align: right.
- .item-subtitle: font-style: italic; color: #475569; font-size: 14px; margin-bottom: 8px.
- .resume-list: padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 16px.
- .skill-label: font-weight: 700; color: #0f172a.

HTML STRUCTURE RULES:
- Apply the exact CSS classes mentioned above.
- Ensure Dates are ALWAYS on the far right using the flexbox item-header.
- Format descriptions strictly as bullet points using action verbs.
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
      
      html = html.replace(/```html/g, "").replace(/```/g, "").trim();
      setResumeHtml(html);

      if (window.innerWidth <= 1024) {
        document.getElementById('previewPane').scrollIntoView({ behavior: 'smooth' });
      }

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container" ref={containerRef}>
      
      <main className="editor-pane scrollable">
        <header className="editor-header">
          <span className="brand-badge">✨ FAANG Standard</span>
          <h1>Resume Workspace</h1>
          <p>Fill in your details below. Our AI will handle the perfect ATS formatting and phrasing.</p>
        </header>

        {/* PERSONAL DETAILS */}
        <div className="form-section">
          <h2 className="section-title">Personal Details</h2>
          <div className="input-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" placeholder="e.g., Harsh Singh" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Target Role</label>
              <input type="text" placeholder="Software Engineer (SDE I)" value={personalInfo.targetRole} onChange={(e) => setPersonalInfo({...personalInfo, targetRole: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="harsh.dev@email.com" value={personalInfo.email} onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="text" placeholder="+91-9876543210" value={personalInfo.phone} onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input type="text" placeholder="Varanasi, India" value={personalInfo.location} onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Professional Links</label>
              <input type="text" placeholder="github.com/user | linkedin.com/in/user" value={personalInfo.links} onChange={(e) => setPersonalInfo({...personalInfo, links: e.target.value})} />
            </div>
          </div>
        </div>

        {/* WORK EXPERIENCE */}
        <div className="form-section">
          <div className="section-header-flex">
            <h2 className="section-title">Work Experience</h2>
            <button className="premium-add" onClick={addExperience}>+ Add Experience</button>
          </div>
          <div className="dynamic-container">
            {experiences.map((exp) => (
              <div key={exp.id} className="card premium-card dynamic-card">
                <button className="remove-btn" onClick={() => removeExperience(exp.id)}>Remove</button>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Job Title & Company</label>
                    <input type="text" placeholder="SDE Intern at Google" value={exp.title} onChange={(e) => updateExperience(exp.id, 'title', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Duration</label>
                    <input type="text" placeholder="May 2025 - July 2025" value={exp.dates} onChange={(e) => updateExperience(exp.id, 'dates', e.target.value)} />
                  </div>
                  <div className="input-group full-width">
                    <label>Key Responsibilities</label>
                    <textarea rows="3" placeholder="- Developed XYZ feature..." value={exp.desc} onChange={(e) => updateExperience(exp.id, 'desc', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROJECTS */}
        <div className="form-section">
          <div className="section-header-flex">
            <h2 className="section-title">Technical Projects</h2>
            <button className="premium-add" onClick={addProject}>+ Add Project</button>
          </div>
          <div className="dynamic-container">
            {projects.map((proj) => (
              <div key={proj.id} className="card premium-card dynamic-card">
                <button className="remove-btn" onClick={() => removeProject(proj.id)}>Remove</button>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Project Name</label>
                    <input type="text" placeholder="Aura-chat" value={proj.title} onChange={(e) => updateProject(proj.id, 'title', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Tech Stack</label>
                    <input type="text" placeholder="React, Node.js" value={proj.tech} onChange={(e) => updateProject(proj.id, 'tech', e.target.value)} />
                  </div>
                  <div className="input-group full-width">
                    <label>Description</label>
                    <textarea rows="3" placeholder="- Built a real-time chat app..." value={proj.desc} onChange={(e) => updateProject(proj.id, 'desc', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EDUCATION */}
        <div className="form-section">
          <h2 className="section-title">Education</h2>
          <div className="card premium-card">
            <div className="input-grid">
              <div className="input-group full-width">
                <label>University / College</label>
                <input type="text" placeholder="XYZ University" value={education.uniName} onChange={(e) => setEducation({...education, uniName: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Degree</label>
                <input type="text" placeholder="B.Tech in Computer Science" value={education.degree} onChange={(e) => setEducation({...education, degree: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Graduation Date</label>
                <input type="text" placeholder="May 2026" value={education.gradDate} onChange={(e) => setEducation({...education, gradDate: e.target.value})} />
              </div>
              <div className="input-group full-width">
                <label>CGPA / Percentage</label>
                <input type="text" placeholder="8.8/10.0" value={education.cgpa} onChange={(e) => setEducation({...education, cgpa: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* SKILLS */}
        <div className="form-section">
          <h2 className="section-title">Technical Skills</h2>
          <div className="input-group full-width">
            <textarea rows="4" placeholder="Languages: Python, Java, JavaScript&#10;Frameworks: React.js, Node.js" value={skills} onChange={(e) => setSkills(e.target.value)}></textarea>
          </div>
        </div>

        {/* CUSTOM SECTIONS */}
        <div className="form-section">
          <div className="section-header-flex">
            <h2 className="section-title">Extra Sections</h2>
            <button className="premium-add" onClick={addCustom}>+ Add Section</button>
          </div>
          <p className="section-subtitle">Certifications, Awards, Languages, or Publications.</p>
          <div className="dynamic-container">
            {customSections.map((sec) => (
              <div key={sec.id} className="card premium-card dynamic-card">
                <button className="remove-btn" onClick={() => removeCustom(sec.id)}>Remove</button>
                <div className="input-grid">
                  <div className="input-group full-width">
                    <label>Section Title</label>
                    <input type="text" placeholder="Certifications" value={sec.title} onChange={(e) => updateCustom(sec.id, 'title', e.target.value)} />
                  </div>
                  <div className="input-group full-width">
                    <label>Details</label>
                    <textarea rows="2" placeholder="AWS Certified..." value={sec.desc} onChange={(e) => updateCustom(sec.id, 'desc', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <div className="generate-wrapper">
          <button className="premium-generate" onClick={generateResume} disabled={isGenerating}>
            {isGenerating ? (
              <><svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg> Generating...</>
            ) : (
              <><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> Generate AI Resume</>
            )}
          </button>
        </div>
      </main>

      {/* DRAG RESIZER */}
      <div className={`resizer ${isResizing ? 'dragging' : ''}`} onMouseDown={handleMouseDown}>
        <div className="resizer-grip"></div>
      </div>

      {/* PREVIEW PANE */}
      <aside className="preview-pane" id="previewPane">
        <div className="preview-toolbar">
          <span className="status-badge"><span className="dot"></span>Live Preview</span>
          <button className="premium-secondary" onClick={() => { if(!resumeHtml) { alert("Generate resume first!"); return; } window.print(); }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download PDF</span>
          </button>
        </div>
        
        <div className="paper-container scrollable">
          <div className="a4-paper">
            {resumeHtml ? (
              <div dangerouslySetInnerHTML={{ __html: resumeHtml }} />
            ) : (
              <div className="empty-state">
                <svg width="75" height="64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <p>Your AI-crafted resume will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </aside>

    </div>
  );
};

export default Build;