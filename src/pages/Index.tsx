
import { 
  Brain, 
  MessageSquare, 
  Wand2, 
  ListTodo,
  Clock4,
  Bell,
  Smartphone,
  BarChart3,
  Shield,
  Calendar,
  Timer,
  HeartPulse,
  Notebook,
  Users,
  Sparkles,
  PanelLeft,
  MoveHorizontal,
  Star
} from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import FeatureSection from "@/components/home/FeatureSection";
import NavButtons from "@/components/home/NavButtons";
import { useEffect } from "react";

const Index = () => {
  // Add scrollable class to body when this component mounts and remove it when it unmounts
  useEffect(() => {
    document.body.classList.add('scrollable-page');
    
    return () => {
      document.body.classList.remove('scrollable-page');
    };
  }, []);

  const aiTaskManagementFeatures = [
    {
      icon: MessageSquare,
      title: "Natural Language & Voice",
      description: "Create and manage tasks using natural language or voice commands. Our AI understands your intent and handles all the details.",
      iconColor: "text-blue-600"
    },
    {
      icon: Brain,
      title: "Intelligent Assistant",
      description: "Chat naturally with your AI assistant for task management, clarifications, and getting personalized productivity advice.",
      iconColor: "text-purple-600"
    },
    {
      icon: Wand2,
      title: "Smart Task Management",
      description: "Get AI suggestions for priorities, deadlines, and dependencies. Automatic categorization and organization of your tasks.",
      iconColor: "text-green-600"
    }
  ];

  const productivityToolsFeatures = [
    {
      icon: Notebook,
      title: "Smart Notes",
      description: "Take notes with voice dictation, organize them by color, and easily link them to related tasks for seamless workflow.",
      iconColor: "text-cyan-600"
    },
    {
      icon: Timer,
      title: "Pomodoro Timer",
      description: "Built-in focus timer helps you work efficiently with customizable work and break intervals.",
      iconColor: "text-blue-600"
    },
    {
      icon: HeartPulse,
      title: "Self Care",
      description: "Track your mental wellbeing, physical wellness, and personal growth. Set daily rituals and emotional care practices.",
      iconColor: "text-pink-600"
    }
  ];

  const organizationFeatures = [
    {
      icon: Calendar,
      title: "Multiple Calendar Views",
      description: "View your tasks in daily, weekly, monthly, or yearly views. Easily navigate between different time perspectives.",
      iconColor: "text-amber-600"
    },
    {
      icon: MoveHorizontal,
      title: "Drag & Drop Interface",
      description: "Intuitive drag and drop functionality to rearrange tasks, adjust schedules, and manage priorities with ease.",
      iconColor: "text-indigo-600"
    },
    {
      icon: Users,
      title: "Task Sharing & Collaboration",
      description: "Share tasks with trusted users, create group tasks, and collaborate efficiently on shared projects.",
      iconColor: "text-green-600"
    }
  ];

  const additionalFeatures = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Visualize your productivity patterns, track completion rates, and gain insights into your work habits.",
      iconColor: "text-violet-600"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Customizable notification system for task deadlines, reminders, and shared task updates across all your devices.",
      iconColor: "text-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end authentication keeps your data safe. All your information stays private and secure.",
      iconColor: "text-red-600"
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-white text-gray-900 py-12 px-4 md:px-8 content-container">
        <NavButtons />
        <HeroSection />
        <FeatureSection title="AI Task Management" features={aiTaskManagementFeatures} />
        <FeatureSection title="Productivity Tools" features={productivityToolsFeatures} />
        <FeatureSection title="Smart Organization" features={organizationFeatures} />
        <FeatureSection title="Additional Features" features={additionalFeatures} />
      </div>
    </>
  );
};

export default Index;
