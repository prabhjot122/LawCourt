
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

interface EventProps {
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  isVirtual: boolean;
  isPast?: boolean;
  delay: number;
}

const Event = ({ title, date, time, location, description, isVirtual, isPast = false, delay }: EventProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300",
        isPast ? "opacity-50" : "",
        "relative overflow-hidden animate-fade-in"
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: "forwards" }}
    >
      <div className="absolute w-1 h-full bg-golden-500 left-0 top-0" />
      
      <div className="flex items-start">
        <div className="mr-4 flex flex-col items-center justify-center bg-golden-50 p-2 rounded-lg min-w-[60px]">
          <span className="text-golden-500 font-bold text-2xl">
            {date.getDate()}
          </span>
          <span className="text-golden-700 text-xs uppercase">
            {date.toLocaleString('default', { month: 'short' })}
          </span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg text-courtroom-dark mb-1">{title}</h3>
          
          <div className="flex items-center text-sm text-courtroom-neutral mb-2 flex-wrap">
            <span className="mr-3">{time}</span>
            <div className="flex items-center">
              <span 
                className={cn(
                  "inline-block w-2 h-2 rounded-full mr-1",
                  isVirtual ? "bg-blue-500" : "bg-green-500"
                )}
              />
              <span>{location}</span>
            </div>
            {isVirtual && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Virtual
              </span>
            )}
          </div>
          
          <p className="text-sm text-courtroom-neutral">{description}</p>
          
          {!isPast && (
            <div className="mt-4">
              <button className="bg-golden-500 hover:bg-golden-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                {isVirtual ? "Join Event" : "Register Now"}
              </button>
              <button className="ml-2 text-golden-500 hover:text-golden-700 text-sm font-medium story-link">
                Add to Calendar
              </button>
            </div>
          )}
          
          {isPast && (
            <div className="mt-4">
              <button className="bg-courtroom-neutral hover:bg-courtroom-dark text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                View Recording
              </button>
              <button className="ml-2 text-courtroom-neutral hover:text-courtroom-dark text-sm font-medium story-link">
                See Resources
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventsSection = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <section 
      id="events" 
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #e8edf2 0%, #dde6f0 100%)"
      }}
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5')] bg-cover bg-center opacity-30" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-courtroom-dark animate-fade-in">
            Events Calendar
          </h2>
          <div className="h-1 w-24 bg-golden-500 mx-auto rounded-full animate-scale-in" style={{ animationDelay: "0.2s" }} />
          <p className="mt-4 text-xl text-courtroom-neutral max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Stay updated with webinars, conferences, and networking opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-xl font-bold mb-4 text-courtroom-dark">Find Events</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Event Categories</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="webinars" className="mr-2" checked />
                  <label htmlFor="webinars">Webinars & Workshops</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="conferences" className="mr-2" checked />
                  <label htmlFor="conferences">Conferences</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="networking" className="mr-2" checked />
                  <label htmlFor="networking">Networking Events</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="training" className="mr-2" checked />
                  <label htmlFor="training">Training Programs</label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6">
              <Event 
                title="Supreme Court Decisions: Annual Review" 
                date={new Date(2025, 5, 10)} 
                time="10:00 AM - 12:00 PM EDT" 
                location="Online" 
                description="Join our panel of constitutional law experts as they analyze this term's most impactful Supreme Court decisions and their implications."
                isVirtual={true}
                delay={1}
              />
              
              <Event 
                title="Legal Tech Innovation Summit" 
                date={new Date(2025, 5, 15)} 
                time="9:00 AM - 5:00 PM PDT" 
                location="San Francisco Convention Center" 
                description="Explore cutting-edge technologies reshaping the legal profession. Featuring demos, panel discussions, and networking opportunities."
                isVirtual={false}
                delay={2}
              />
              
              <Event 
                title="Pro Bono Clinic: Immigration Law" 
                date={new Date(2025, 5, 20)} 
                time="1:00 PM - 6:00 PM CDT" 
                location="Community Legal Center" 
                description="Volunteer attorneys will provide free legal assistance to individuals with immigration concerns. Registration required for both volunteers and clients."
                isVirtual={false}
                delay={3}
              />
              
              <Event 
                title="Negotiation Skills Workshop" 
                date={new Date(2025, 4, 15)} 
                time="2:00 PM - 4:00 PM EDT" 
                location="Online" 
                description="Learn advanced negotiation techniques from experienced mediators. Interactive exercises and real-world case studies included."
                isVirtual={true}
                isPast={true}
                delay={4}
              />
              
              <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <button className="bg-golden-500 hover:bg-golden-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg transform hover:scale-105">
                  View Full Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
