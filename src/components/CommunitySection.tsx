
import React from 'react';
import { cn } from '@/lib/utils';

interface DiscussionThreadProps {
  title: string;
  author: string;
  replies: number;
  tags: string[];
  delay: number;
}

const DiscussionThread = ({ title, author, replies, tags, delay }: DiscussionThreadProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300",
        "transform hover:-translate-y-1 border border-golden-100 cursor-pointer",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: "forwards" }}
    >
      <h3 className="font-bold text-lg text-courtroom-dark">{title}</h3>
      <div className="flex items-center mt-2 text-sm text-courtroom-neutral">
        <div className="w-6 h-6 rounded-full bg-golden-200 flex items-center justify-center mr-2 text-xs">
          {author.charAt(0)}
        </div>
        <span>{author}</span>
        <span className="mx-2">•</span>
        <span>{replies} replies</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className="bg-golden-50 text-golden-700 text-xs px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const CommunitySection = () => {
  return (
    <section 
      id="community" 
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f7f3ea 0%, #f0f0f0 100%)"
      }}
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c')] bg-cover bg-center opacity-40" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-courtroom-dark animate-fade-in">
            Community Hub
          </h2>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full animate-scale-in" style={{ animationDelay: "0.2s" }} />
          <p className="mt-4 text-xl text-courtroom-neutral max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Connect with fellow legal professionals, students, and enthusiasts in our virtual courtyard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-golden-50 to-white p-8 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-2xl font-bold text-courtroom-dark mb-4">Study Groups</h3>
            <p className="text-courtroom-neutral mb-6">Join focused study groups for different areas of law. Collaborate on case studies and share insights.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <DiscussionThread 
                title="Constitutional Law Finals Study Group" 
                author="James Wilson" 
                replies={24} 
                tags={["Study Group", "Constitutional Law"]}
                delay={1}
              />
              <DiscussionThread 
                title="Contract Law Practice Problems" 
                author="Elena Rodriguez" 
                replies={18} 
                tags={["Study Group", "Contract Law"]}
                delay={2}
              />
              <DiscussionThread 
                title="Criminal Procedure Mock Trial Prep" 
                author="Michael Chen" 
                replies={32} 
                tags={["Study Group", "Criminal Law"]}
                delay={3}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-golden-50 to-white p-8 rounded-xl shadow-lg animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <h3 className="text-2xl font-bold text-courtroom-dark mb-4">Mentorship Program</h3>
            <p className="text-courtroom-neutral mb-6">Connect with experienced professionals willing to guide you through your legal career journey.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <DiscussionThread 
                title="1L Survival Guide & Mentorship" 
                author="Judge Sarah Parker" 
                replies={45} 
                tags={["Mentorship", "Law School"]}
                delay={4}
              />
              <DiscussionThread 
                title="Corporate Law Career Path Discussion" 
                author="Thomas Zhang" 
                replies={29} 
                tags={["Mentorship", "Corporate Law"]}
                delay={5}
              />
              <DiscussionThread 
                title="Public Interest Law: Experiences & Advice" 
                author="Maria Gonzalez" 
                replies={37} 
                tags={["Mentorship", "Public Interest"]}
                delay={6}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-fade-in" style={{ animationDelay: "1s" }}>
          <div className="text-center md:text-right">
            <div className="text-4xl font-bold text-golden-500">10K+</div>
            <div className="text-courtroom-neutral">Active Members</div>
          </div>
          
          <div className="h-12 w-px bg-golden-200 hidden md:block"></div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-golden-500">250+</div>
            <div className="text-courtroom-neutral">Daily Discussions</div>
          </div>
          
          <div className="h-12 w-px bg-golden-200 hidden md:block"></div>
          
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-golden-500">50+</div>
            <div className="text-courtroom-neutral">Expert Mentors</div>
          </div>
        </div>

        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "1.2s" }}>
          <button className="bg-golden-500 hover:bg-golden-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg transform hover:scale-105">
            Join The Community
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
