
import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface DocumentCardProps {
  title: string;
  description: string;
  isNew?: boolean;
  delay: number;
}

const DocumentCard = ({ title, description, isNew = false, delay }: DocumentCardProps) => {
  return (
    <Card 
      className={cn(
        "w-full max-w-md relative overflow-hidden hover:shadow-xl transform transition-all duration-300",
        "hover:-translate-y-2 bg-white hover:bg-golden-50",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: "forwards" }}
    >
      {isNew && (
        <div className="absolute -right-8 top-6 bg-red-500 text-white px-10 transform rotate-45 text-xs font-bold py-1">
          NEW
        </div>
      )}
      <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-bl from-golden-100 to-transparent" />
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-courtroom-dark">{title}</h3>
        <p className="text-courtroom-neutral">{description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-courtroom-neutral">Updated 3 days ago</span>
          <button className="text-golden-500 hover:text-golden-700 font-medium text-sm story-link">
            View Document
          </button>
        </div>
      </div>
    </Card>
  );
};

const ResourcesSection = () => {
  return (
    <section 
      id="resources" 
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7f3ea 100%)"
      }}
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6')] bg-cover bg-center opacity-40" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-courtroom-dark animate-fade-in">
            Resources
          </h2>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full animate-scale-in" style={{ animationDelay: "0.2s" }} />
          <p className="mt-4 text-xl text-courtroom-neutral max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Access our comprehensive library of legal documents, case studies, and research materials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DocumentCard 
            title="Constitutional Law Handbook" 
            description="Complete guide to constitutional principles, landmark cases, and interpretation methodologies."
            isNew={true}
            delay={1}
          />
          <DocumentCard 
            title="Contract Templates" 
            description="Over 50 legally-reviewed contract templates for various business and personal needs."
            delay={2}
          />
          <DocumentCard 
            title="Case Law Database" 
            description="Searchable archive of 10,000+ landmark legal cases with summaries and analyses."
            delay={3}
          />
          <DocumentCard 
            title="Legal Research Methods" 
            description="Comprehensive guide to conducting effective legal research with modern resources."
            delay={4}
          />
          <DocumentCard 
            title="Intellectual Property Guide" 
            description="Everything you need to know about patents, trademarks, copyrights, and trade secrets."
            isNew={true}
            delay={5}
          />
          <DocumentCard 
            title="Criminal Procedure Manual" 
            description="Step-by-step procedures for criminal cases from investigation to appeal."
            delay={6}
          />
        </div>

        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "1s" }}>
          <button className="bg-golden-500 hover:bg-golden-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg transform hover:scale-105">
            Explore All Resources
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
