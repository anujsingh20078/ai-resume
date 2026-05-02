import { useState, useEffect } from 'react';
import constants, {
  buildPresenceChecklist,
  METRIC_CONFIG,
} from "../constants.js";
import * as pdfjsL from "pdfjs-dist";

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker?worker";

// 👇 NAYA: Apne build.jsx ko import karein (path check kar lena)
import Build from './building/build.jsx';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

function App() {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceChecklist, setPresenceChecklist] = useState(buildPresenceChecklist());
  
  // 👇 NAYA: State jo decide karega ki Analyzer dikhana hai ya Builder
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsL.getDocument({ data: arrayBuffer }).promise;

    const texts = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) =>
        pdf.getPage(i + 1).then((page) =>
          page
            .getTextContent()
            .then((tc) => tc.items.map((item) => item.str).join(" "))
        )
      )
    );

    return texts.join("\n").trim();
  };

  const parseJSONResponse = (response) => {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};
      if (!parsed.overallScore && !parsed.error) {
        throw new Error("Invalid response format");
      }
      return parsed;
    } catch (err) {
      throw new Error(`Failed to parse AI response: ${err.message}`);
    }
  };

  const analyzeResume = async (text) => {
    const prompt = constants.ANALYZE_RESUME_PROMPT.replace(
      "{{DOCUMENT_TEXT}}",
      text
    );
    const response = await window.puter.ai.chat(
      [
        { role: "system", content: "You are an expert resume reviewer..." },
        { role: "user", content: prompt },
      ],
      {
        model: "gpt-4o",
      }
    );
    
    const messageContent = typeof response === "string" ? JSON.parse(response) : response.message?.content || "";
    const result = parseJSONResponse(messageContent);
    
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
      return alert("Please upload a valid PDF file only.");
    }
    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist(buildPresenceChecklist());

    try {
      const text = await extractTextFromPDF(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));
      setAnalysis(await analyzeResume(text));
    } catch (err) {
      alert(`Error processing file: ${err.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist(buildPresenceChecklist());
  };

  // 👇 NAYA: Agar showBuilder true hai, toh direct apna Resume Builder render kar do
  if (showBuilder) {
    return <Build />;
  }

  return (
    <div className="min-h-screen bg-main-gradient p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light bg-[linear-gradient(90deg,gray,#22c55e)] bg-clip-text text-transparent mb-3 px-2">
            AI Resume Analyzer & Builder 
          </h1>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg bg-clip-text text-transparent bg-[linear-gradient(90deg,gray,#22c55e)] px-4"> 
            Upload your PDF resume and get instant AI feedback
          </p>
        </div>

        {/* Upload Area */}
        {!uploadedFile && (
          <div className="upload-area p-6 sm:p-10 rounded-2xl text-center border border-dashed border-slate-600 bg-slate-800/50">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">📑</div>
            <p className="text-slate-400 mb-6 text-sm sm:text-base px-2">
              📖 PDF files only. Get instant feedback on your resume.
            </p>

            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={!aiReady}
              className="hidden"
              id="file-upload"
            />
            
            {/* Action Buttons: Stack on mobile, side-by-side on larger screens */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
              <label
                htmlFor="file-upload"
                className={`w-full sm:w-auto text-center btn-primary py-3 px-6 rounded-lg transition-all ${
                  !aiReady ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                }`}
              >
                📃 Choose PDF File
              </label>
              
              <button
                onClick={() => setShowBuilder(true)}
                disabled={!aiReady}
                className={`w-full sm:w-auto text-center btn-primary py-3 px-6 rounded-lg transition-all ${
                  !aiReady ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer hover:scale-105"
                }`}
              >
                🆔 Generate Resume
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 sm:p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="loading-spinner mb-4 mx-auto"></div>
              <h3 className="text-xl sm:text-2xl text-slate-200 mb-2">Analyzing Your Resume</h3>
              <p className="text-slate-400 text-sm sm:text-base">Please wait while AI reviews your resume...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {analysis && uploadedFile && (
          <div className="space-y-6 sm:space-y-8 mt-6">
            
            {/* File Info Card */}
            <div className="file-info-card p-4 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                  <div className="icon-container-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 shrink-0 p-3 rounded-lg">
                    <span className="text-2xl sm:text-3xl">📑</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-green-500 mb-1">
                      Analysis Complete
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm truncate w-full max-w-[200px] sm:max-w-xs md:max-w-md">
                      {uploadedFile.name}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="w-full sm:w-auto btn-secondary py-2 px-4 rounded-lg text-sm sm:text-base">
                  Analyze Another Resume
                </button>
              </div>
            </div>

            {/* Score Card */}
            <div className="score-card p-6 sm:p-8 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Overall Score</h2>
                </div>
                <p className="relative">
                  <span className="text-6xl sm:text-8xl font-extrabold text-cyan-400 drop-shadow-lg">
                    {analysis.overallScore || "7"}
                  </span>
                </p>
                <div
                  className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${
                    parseInt(analysis.overallScore) >= 8
                      ? "bg-green-500/20 text-green-400"
                      : parseInt(analysis.overallScore) >= 6
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <span className="font-semibold text-sm sm:text-lg">
                    {parseInt(analysis.overallScore) >= 8
                      ? "Excellent"
                      : parseInt(analysis.overallScore) >= 6
                      ? "Good"
                      : "Needs Improvement"}
                  </span>
                </div>
              </div>

              <div className="progress-bar w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                    parseInt(analysis.overallScore) >= 8
                      ? "bg-green-500"
                      : parseInt(analysis.overallScore) >= 6
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${(parseInt(analysis.overallScore) / 10) * 100}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 text-center font-medium px-2">
                Score based on content quality, formatting, keyword usage
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="feature-card-green group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-green-500/30">
                <div className="bg-green-500/20 icon-container-lg w-12 h-12 flex items-center justify-center rounded-full mb-4 group-hover:bg-green-400/30 transition-colors">
                  <span className="text-green-300 text-xl">✔️</span>
                </div>
                <h4 className="text-green-300 text-sm font-semibold uppercase tracking-wide mb-3">
                  Main Strengths
                </h4>
                <div className="space-y-3 text-left">
                  {(analysis.strengths || analysis.strenghts || []).slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-green-400 text-sm mt-0.5">•</span>
                      <span className="text-slate-200 font-medium text-sm leading-relaxed">
                        {strength}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feature-card-orange group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-orange-500/30">
                <div className="bg-orange-500/20 icon-container-lg w-12 h-12 flex items-center justify-center rounded-full mb-4 group-hover:bg-orange-400/30 transition-colors">
                  <span className="text-orange-300 text-xl">⚡</span>
                </div>
                <h4 className="text-orange-300 text-sm font-semibold uppercase tracking-wide mb-3">
                  Main Improvements
                </h4>
                <div className="space-y-3 text-left">
                  {(analysis.improvements || []).slice(0, 3).map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-orange-400 text-sm mt-0.5">•</span>
                      <span className="text-slate-200 font-medium text-sm leading-relaxed">
                        {improvement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="section-card group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="icon-container-lg bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-400/30 transition-colors">
                  <span className="text-blue-300 text-xl">🛡️</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white">Executive Summary</h4>
              </div>
              <div className="summary-box bg-slate-900/50 p-4 rounded-lg">
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="section-card group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="icon-container-lg bg-cyan-500/20 p-2 rounded-lg group-hover:bg-cyan-400/30 transition-colors">
                  <span className="text-cyan-300 text-lg">🎖️</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-white">Performance Metrics</h4>
              </div>

              <div className="space-y-5">
                {METRIC_CONFIG.map((cfg, i) => {
                  const value =
                    (analysis.performanceMetrics && analysis.performanceMetrics[cfg.key]) ??
                    cfg.defaultValue;
                  return (
                    <div key={i} className="group/item">
                      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg.icon}</span>
                          <p className="text-slate-200 font-medium text-sm sm:text-base">{cfg.label}</p>
                        </div>
                        <span className="text-slate-300 font-bold text-sm sm:text-base">{value}/10</span>
                      </div>
                      <div className="progress-bar-small w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${cfg.colorClass} rounded-full transition-all duration-1000 ease-out group-hover/item:shadow-lg`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resume Insights (Grid on Desktop) */}
            <div className="section-card group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-container-lg bg-purple-500/20 p-2 rounded-lg">
                  <span className="text-lg text-purple-300">🔎</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-purple-400">Resume Insights</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="info-box-cyan group/item bg-cyan-900/20 p-4 sm:p-5 rounded-lg border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg text-cyan-400">🎯</span>
                    <h3 className="text-cyan-300 font-semibold text-sm sm:text-base">Action Items</h3>
                  </div>
                  <div className="space-y-3 text-left">
                    {(analysis.actionItems || [
                      "Optimize keyword placement for better ATS scoring",
                      "Enhance content with quantifiable achievements",
                      "Consider industry-specific terminology",
                    ]).map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span className="text-slate-200 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="info-box-emerald group/item bg-emerald-900/20 p-4 sm:p-5 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg text-emerald-400">💡</span>
                    <h3 className="text-emerald-300 font-semibold text-sm sm:text-base">Pro Tips</h3>
                  </div>
                  <div className="space-y-3">
                    {(analysis.proTips || analysis.protips || [
                      "Use action verbs to start bullet points",
                      "Keep descriptions concise and impactful",
                      "Tailor keywords to specific job descriptions",
                    ]).map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span className="text-slate-200 text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ATS Optimization */}
            <div className="section-card group p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="icon-container bg-violet-500/20 p-2 rounded-lg">
                  <span className="text-lg">🤖</span>
                </div>
                <h2 className="text-violet-400 font-bold text-lg sm:text-xl">ATS Optimization</h2>
              </div>

              <div className="info-box-violet mb-6 bg-violet-900/20 p-4 sm:p-5 rounded-lg border border-violet-500/20">
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="text-violet-300 font-semibold mb-2 text-sm sm:text-base">What is ATS?</h3>
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                      Applicant Tracking Systems (ATS) are software tools used by employers to manage the recruitment process. They help in sorting, scanning, and ranking resumes based on specific criteria, such as keywords, formatting, and relevant experience. Optimizing your resume for ATS can increase the chances of it being seen by human recruiters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="info-box-violet group/item">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-violet-300">
                    ATS Compatibility Checklist
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(analysis.atsChecklist || presenceChecklist || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-slate-200 bg-slate-900/50 p-2 sm:p-3 rounded-lg">
                      <span className={`mt-0.5 ${item.present ? "text-emerald-400" : "text-red-400"}`}>
                        {item.present ? "✓" : "✗"}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="section-card p-5 sm:p-6 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="icon-container bg-blue-500/20 p-2 rounded-lg">
                  <span className="text-lg">🔑</span>
                </div>
                <h2 className="text-blue-400 font-bold text-lg sm:text-xl">Recommended Keywords</h2>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
                {(analysis.keywords || []).map((keyword, index) => (
                  <span key={index} className="keyword-tag group/item bg-blue-900/30 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full text-xs sm:text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="info-box-blue bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed flex items-start gap-2">
                  <span className="text-lg mt-0">💡</span>
                  <span>Consider incorporating these keywords naturally into your resume to improve ATS ranking. Focus on relevant skills, job titles, and industry-specific terms that align with the positions you're targeting.</span>
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;