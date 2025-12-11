import React, { useState } from 'react';
import { generatePageContent, generateIllustration } from './services/gemini';
import { GeneratedData } from './types';
import { GeneratedContent } from './components/GeneratedContent';
import { Loader2, Sparkles, FileArchive, Link as LinkIcon, Type, Download, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';

export default function App() {
  const [title, setTitle] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('https://byvn.net/mwYb');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<GeneratedData | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError(null);
    setData(null);
    setGeneratedImages([]);

    try {
      // Step 1: Generate Text Content
      const content = await generatePageContent(title);
      setData(content);
      setIsLoading(false);

      // Step 2: Generate Images
      if (content.imagePrompts && content.imagePrompts.length > 0) {
        setLoadingImages(true);
        // Limit to 3 images as requested
        const imagePromises = content.imagePrompts.slice(0, 3).map(prompt => 
           generateIllustration(prompt).catch(err => {
             console.error("图片生成失败:", prompt, err);
             return null; 
           })
        );

        const results = await Promise.all(imagePromises);
        setGeneratedImages(results.filter((img): img is string => img !== null));
        setLoadingImages(false);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成内容时发生错误。");
      setIsLoading(false);
      setLoadingImages(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!data) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const docTitle = title.trim();
      const targetUrl = redirectUrl.trim();

      // --- 1. IMAGES ---
      if (generatedImages.length > 0) {
        generatedImages.forEach((imgDataUrl, idx) => {
           const fileName = `vp${idx + 1}.png`; 
           const data = imgDataUrl.split(',')[1];
           zip.file(fileName, data, {base64: true});
        });
      }

      // --- 2. INDEX.HTML ---
      const metaDescription = data.introduction.replace(/"/g, '&quot;').substring(0, 160);
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${targetUrl}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <meta name="description" content="${metaDescription}">
    <meta name="keywords" content="${docTitle}, 资源分享, 在线阅读">
    <meta name="robots" content="index, follow">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { opacity: 0; transition: opacity 0.5s; } window.onload = function() { document.body.style.opacity = 1; }</style>
</head>
<body class="bg-gray-50 text-gray-900 font-sans antialiased">
    <noscript>
        <div class="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div class="text-center p-6 max-w-md">
                <h2 class="text-xl font-bold text-red-600 mb-2">需要跳转</h2>
                <p class="text-gray-600 mb-4">如果页面没有自动跳转，请点击下方按钮。</p>
                <a href="${targetUrl}" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">点击跳转</a>
            </div>
        </div>
    </noscript>

    <article class="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <!-- Title strictly uses user input and links to redirectUrl -->
        <header class="text-center mb-12">
            <h1 class="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                <a href="${targetUrl}" class="hover:text-blue-600 transition-colors">
                    ${docTitle}
                </a>
            </h1>
            <div class="w-16 h-1 bg-blue-600 mx-auto rounded-full mb-8"></div>
            <p class="text-xl text-gray-600 leading-relaxed font-light">${data.introduction}</p>
        </header>
        
        <!-- Image Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            ${generatedImages.map((_, i) => `
            <figure class="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img src="./vp${i+1}.png" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" alt="${docTitle} 插图 ${i+1}">
            </figure>
            `).join('')}
        </div>

        <!-- Content -->
        <div class="prose prose-lg prose-blue max-w-none text-gray-700">
            ${data.sections.map(s => `
            <div class="mb-10">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">${s.heading}</h2>
                <p class="leading-8 text-justify">${s.content}</p>
            </div>
            `).join('')}
        </div>

        <!-- Conclusion -->
        <footer class="mt-16 pt-8 border-t border-gray-200">
            <div class="bg-blue-50 rounded-2xl p-8 text-center">
                <h2 class="text-xl font-bold text-blue-900 mb-3">总结</h2>
                <p class="text-blue-800 mb-6">${data.conclusion}</p>
                 <a href="${targetUrl}" class="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                    了解更多详情 &rarr;
                 </a>
            </div>
        </footer>
    </article>
</body>
</html>`;
      zip.file("index.html", htmlContent);
      
      // --- 3. README.md ---
      let readmeContent = `# [${docTitle}](${targetUrl})\n\n`;
      // Added CTA link below title
      readmeContent += `[👉 点击此处阅读完整详情](${targetUrl})\n\n`; 
      readmeContent += `> ${data.introduction}\n\n`;
      if (generatedImages.length > 0) readmeContent += `![${docTitle} 1](./vp1.png)\n\n`;
      data.sections.forEach((section, idx) => {
        readmeContent += `## ${section.heading}\n\n${section.content}\n\n`;
        if (generatedImages.length > idx + 1) readmeContent += `![${docTitle} ${idx + 2}](./vp${idx + 2}.png)\n\n`;
      });
      readmeContent += `## 结论\n\n${data.conclusion}\n\n---\n\n[阅读全文](${targetUrl})`;
      zip.file("README.md", readmeContent);

      // --- 4. EXTRAS ---
      zip.file("LICENSE", "MIT License..."); // Shortened for brevity in code block
      zip.file(".gitignore", "node_modules/\ndist/");
      zip.file("robots.txt", "User-agent: *\nAllow: /\nSitemap: sitemap.xml");
      zip.file("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${targetUrl}</loc></url></urlset>`);

      // --- 5. GENERATE ---
      const content = await zip.generateAsync({type:"blob"});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${docTitle.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error(err);
      alert("ZIP 生成失败");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-tr from-brand-600 to-accent-600 p-2.5 rounded-xl shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                AI Site Generator
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">STATIC SITE BUILDER</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold text-slate-500">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Gemini 2.5 Active
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl relative z-10">
        
        {/* Input Card */}
        <section className="mb-12 animate-slide-up">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white p-1">
            <div className="bg-white/50 rounded-[22px] p-8 md:p-10 border border-slate-100">
              
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">配置您的项目</h2>
                <p className="text-slate-500 text-lg">输入关键词，AI 将自动完成文章撰写、配图绘制及网站打包。</p>
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-6 max-w-2xl mx-auto">
                
                {/* Title Input */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 flex items-center gap-2">
                    <Type className="w-4 h-4 text-brand-500" />
                    文章主题 (Title)
                  </label>
                  <div className="relative transition-all duration-300 focus-within:transform focus-within:-translate-y-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例如：2025年人工智能发展趋势"
                      className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm font-medium text-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Redirect Link Input */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-brand-500" />
                    跳转链接 (Redirect URL)
                  </label>
                  <div className="relative transition-all duration-300 focus-within:transform focus-within:-translate-y-1">
                    <input
                      type="url"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm font-medium"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className="mt-4 w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>AI 正在思考与创作...</span>
                    </>
                  ) : (
                    <>
                      <span>开始生成内容</span>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
            <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {error}
            </div>
          </div>
        )}

        {/* Success Action Bar */}
        {data && (
           <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up w-[90%] max-w-md">
             <button 
               onClick={handleDownloadZip}
               disabled={isZipping || loadingImages}
               className="w-full bg-slate-900/90 backdrop-blur-md hover:bg-black text-white p-1.5 pr-6 rounded-full shadow-2xl hover:shadow-black/30 transition-all border border-slate-700/50 flex items-center gap-4 group"
             >
                <div className="bg-green-500 rounded-full p-3 text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    {isZipping ? <Loader2 className="w-6 h-6 animate-spin"/> : <CheckCircle2 className="w-6 h-6"/>}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-bold text-base">下载项目 ZIP</div>
                    <div className="text-xs text-slate-300">包含 HTML, README & 图片</div>
                </div>
                <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
             </button>
           </div>
        )}

        {/* Results Preview */}
        {data && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 mb-24 animate-fade-in">
            <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-100 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                <FileArchive className="w-4 h-4" />
                Preview Mode
            </div>
            <GeneratedContent 
              data={data} 
              images={generatedImages} 
              loadingImages={loadingImages} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center relative z-10">
        <p className="text-slate-400 text-sm font-medium">
          Powered by Google Gemini 2.5 & React 19
        </p>
      </footer>
    </div>
  );
}