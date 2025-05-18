
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface OpportunityProps {
  title: string;
  organization: string;
  location: string;
  deadline: string;
  tags: string[];
  isHot?: boolean;
  delay: number;
}

const Opportunity = ({ title, organization, location, deadline, tags, isHot = false, delay }: OpportunityProps) => {
  const daysTillDeadline = () => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const days = daysTillDeadline();
  
  return (
    <Card 
      className={cn(
        "w-full max-w-md relative overflow-hidden",
        "hover:shadow-xl transform transition-all duration-300",
        "hover:-translate-y-2 bg-white",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: "forwards" }}
    >
      {isHot && (
        <div className="absolute right-0 top-0 bg-red-500 text-white px-4 py-1 text-xs font-bold">
          HOT
        </div>
      )}
      <div className="p-6">
        <h3 className="font-bold text-xl mb-1 text-courtroom-dark">{title}</h3>
        <p className="text-courtroom-neutral font-medium">{organization}</p>
        <div className="mt-2 flex items-center text-sm text-courtroom-neutral">
          <span className="mr-3">{location}</span>
          <span className="flex items-center">
            <span 
              className={cn(
                "w-2 h-2 rounded-full mr-1",
                days <= 3 ? "bg-red-500" : days <= 7 ? "bg-amber-500" : "bg-green-500",
                days <= 3 ? "animate-glow" : ""
              )}
            />
            <span className={days <= 3 ? "text-red-600 font-semibold" : ""}>
              {days <= 0 ? "Deadline passed" : `${days} days left`}
            </span>
          </span>
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
        
        <div className="mt-4 flex justify-between items-center">
          <button className="bg-courtroom-dark hover:bg-black text-white px-4 py-1 rounded text-sm transition-colors">
            View Details
          </button>
          <button className="text-golden-500 hover:text-golden-700 font-medium text-sm story-link">
            Apply Now
          </button>
        </div>
      </div>
    </Card>
  );
};

const CareerSection = () => {
  const [filter, setFilter] = useState("all");
  
  return (
    <section 
      id="career" 
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f0f0f0 0%, #e8edf2 100%)"
      }}
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1483058712412-4245e9b90334')] bg-cover bg-center opacity-40" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-courtroom-dark animate-fade-in">
            Career Portal
          </h2>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full animate-scale-in" style={{ animationDelay: "0.2s" }} />
          <p className="mt-4 text-xl text-courtroom-neutral max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Discover internships, clerkships, and job opportunities in the legal field.
          </p>
        </div>

        <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="bg-white rounded-full shadow-md p-1 flex">
            <button 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === "all" ? "bg-golden-500 text-white" : "hover:bg-golden-50"
              )}
              onClick={() => setFilter("all")}
            >
              All Opportunities
            </button>
            <button 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === "internships" ? "bg-golden-500 text-white" : "hover:bg-golden-50"
              )}
              onClick={() => setFilter("internships")}
            >
              Internships
            </button>
            <button 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === "jobs" ? "bg-golden-500 text-white" : "hover:bg-golden-50"
              )}
              onClick={() => setFilter("jobs")}
            >
              Full-Time Jobs
            </button>
            <button 
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === "clerkships" ? "bg-golden-500 text-white" : "hover:bg-golden-50"
              )}
              onClick={() => setFilter("clerkships")}
            >
              Clerkships
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Opportunity 
            title="Summer Associate" 
            organization="Johnson & Meyer LLP" 
            location="New York, NY" 
            deadline="2025-06-15" 
            tags={["Internship", "Corporate Law", "Paid"]}
            isHot={true}
            delay={1}
          />
          <Opportunity 
            title="Judicial Law Clerk" 
            organization="U.S. District Court, Southern District" 
            location="Miami, FL" 
            deadline="2025-05-28" 
            tags={["Clerkship", "Federal Court"]}
            delay={2}
          />
          <Opportunity 
            title="Legal Research Assistant" 
            organization="State University Law Review" 
            location="Boston, MA" 
            deadline="2025-05-24" 
            tags={["Part-time", "Research", "Academic"]}
            delay={3}
          />
          <Opportunity 
            title="IP Law Associate" 
            organization="Tech Legal Solutions" 
            location="San Francisco, CA" 
            deadline="2025-06-30" 
            tags={["Full-time", "Intellectual Property", "3+ Years Experience"]}
            isHot={true}
            delay={4}
          />
          <Opportunity 
            title="Environmental Law Fellow" 
            organization="Climate Justice Initiative" 
            location="Washington, DC" 
            deadline="2025-07-10" 
            tags={["Fellowship", "Environmental Law", "Non-profit"]}
            delay={5}
          />
          <Opportunity 
            title="Corporate Counsel" 
            organization="Nexus Technologies Inc." 
            location="Austin, TX" 
            deadline="2025-06-25" 
            tags={["Full-time", "Corporate", "In-house"]}
            delay={6}
          />
        </div>

        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "1s" }}>
          <button className="bg-golden-500 hover:bg-golden-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg transform hover:scale-105">
            Browse All Opportunities
          </button>
        </div>
      </div>
    </section>
  );
};

export default CareerSection;
