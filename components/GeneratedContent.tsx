import React from 'react';
import { GeneratedData } from '../types';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  data: GeneratedData;
  images: string[];
  loadingImages: boolean;
}

export const GeneratedContent: React.FC<Props> = ({ data, images, loadingImages }) => {
  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      
      {/* Article Header */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          {data.title}
        </h1>
        <div className="flex items-center justify-center gap-4">
             <div className="h-1 w-16 bg-gradient-to-r from-brand-400 to-accent-500 rounded-full"></div>
        </div>
        <p className="text-xl text-slate-600 leading-relaxed font-light">
          {data.introduction}
        </p>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10">
        {loadingImages ? (
          // Skeleton Loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
              <ImageIcon className="w-10 h-10 text-slate-300" />
            </div>
          ))
        ) : (
          // Display Generated Images
          images.map((imgSrc, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 aspect-square cursor-zoom-in">
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10"></div>
              <img 
                src={imgSrc} 
                alt={`Illustration ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          ))
        )}
      </div>

      {/* Main Content Sections */}
      <div className="space-y-10">
        {data.sections.map((section, idx) => (
          <section key={idx} className="relative pl-6 md:pl-0">
             {/* Decorative line for mobile */}
             <div className="absolute left-0 top-2 bottom-0 w-1 bg-slate-100 rounded-full md:hidden"></div>
             
             <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
               <span className="hidden md:flex w-8 h-8 rounded-full bg-brand-50 text-brand-600 items-center justify-center text-sm font-bold border border-brand-100 shadow-sm shrink-0">
                 {idx + 1}
               </span>
               {section.heading}
             </h3>
             <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-8 text-justify">
                <p>{section.content}</p>
             </div>
          </section>
        ))}
      </div>

      {/* Conclusion Card */}
      <div className="bg-gradient-to-br from-slate-50 to-brand-50/50 p-8 md:p-10 rounded-3xl border border-brand-100/50 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-accent-500 rounded-full"></span>
            结论
        </h3>
        <p className="text-slate-700 leading-relaxed text-lg">
          {data.conclusion}
        </p>
      </div>

    </div>
  );
};