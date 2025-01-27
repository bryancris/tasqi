import { 
  Brain, 
  MessageSquare, 
  Wand2, 
  ListTodo,
  Clock4,
  Bell,
  Smartphone,
  BarChart3,
  Shield
} from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import FeatureSection from "@/components/home/FeatureSection";

const Index = () => {
  const aiProductivityFeatures = [
    {
      icon: MessageSquare,
      title: "Natural Language & Voice",
      description: "Create and manage tasks using natural language. Our advanced AI understands your intent and handles the details.",
      iconColor: "text-blue-400"
    },
    {
      icon: Wand2,
      title: "AI Task Enhancement",
      description: "Get smart suggestions for priorities, deadlines, and dependencies. Vision API processes task-related images.",
      iconColor: "text-purple-400"
    },
    {
      icon: Brain,
      title: "Intelligent Chat",
      description: "Chat naturally with your AI assistant for task clarification and management. Handles recurring tasks and conflicts.",
      iconColor: "text-green-400"
    }
  ];

  const specializedAgentsFeatures = [
    {
      icon: ListTodo,
      title: "Task Planning Agent",
      description: "Intelligent agent that helps break down complex projects into manageable tasks, setting realistic milestones and schedule.",
      iconColor: "text-cyan-400"
    },
    {
      icon: Clock4,
      title: "Time Management Agent",
      description: "Monitors your work patterns, suggests optimal time slots for tasks, and helps you keep up with deadlines effectively.",
      iconColor: "text-blue-400"
    },
    {
      icon: Bell,
      title: "Priority Assistant",
      description: "Smart agent that analyzes task importance, adjusts priorities based on deadlines, and helps maintain optimal workflow.",
      iconColor: "text-purple-400"
    }
  ];

  const mobileFirstFeatures = [
    {
      icon: Smartphone,
      title: "Mobile Excellence",
      description: "Install as a PWA with offline support. Responsive design ensures a great experience on any device.",
      iconColor: "text-pink-400"
    },
    {
      icon: BarChart3,
      title: "Productivity Insights",
      description: "Track task completion, analyze patterns, and monitor habit formation with detailed statistics.",
      iconColor: "text-yellow-400"
    },
    {
      icon: Shield,
      title: "Secure & Customizable",
      description: "End-to-end authentication keeps your data safe. Personalize with dark/light mode and themes.",
      iconColor: "text-green-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1b3b] text-white py-12 px-4 md:px-8">
      <HeroSection />
      <FeatureSection title="AI-Powered Productivity" features={aiProductivityFeatures} />
      <FeatureSection title="Specialized AI Agents" features={specializedAgentsFeatures} />
      <FeatureSection title="Mobile First & Data Driven" features={mobileFirstFeatures} />
    </div>
  );
};

export default Index;