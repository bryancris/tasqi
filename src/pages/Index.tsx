import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Calendar, 
  Clock, 
  Bell, 
  MessageSquare, 
  Wand2, 
  ListTodo,
  Clock4,
  Smartphone,
  BarChart3,
  Shield
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#1a1b3b] text-white py-12 px-4 md:px-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20">
        <img 
          src="/lovable-uploads/98b0b439-cc30-41da-8912-7786e473fb9a.png" 
          alt="TASQI-AI Logo" 
          className="w-24 h-24 mx-auto mb-8"
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Your AI Task Assistant
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
          Transform your productivity with AI-powered task management. From voice
          commands to image processing, our assistant understands and adapts to
          your workflow.
        </p>
      </div>

      {/* AI-Powered Productivity Section */}
      <div className="max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">AI-Powered Productivity</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <MessageSquare className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Natural Language & Voice</h3>
              <p className="text-gray-400">Create and manage tasks using natural language. Our advanced AI understands your intent and handles the details.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Wand2 className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Task Enhancement</h3>
              <p className="text-gray-400">Get smart suggestions for priorities, deadlines, and dependencies. Vision API processes task-related images.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Brain className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Intelligent Chat</h3>
              <p className="text-gray-400">Chat naturally with your AI assistant for task clarification and management. Handles recurring tasks and conflicts.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Specialized AI Agents Section */}
      <div className="max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Specialized AI Agents</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <ListTodo className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Task Planning Agent</h3>
              <p className="text-gray-400">Intelligent agent that helps break down complex projects into manageable tasks, setting realistic milestones and schedule.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Clock4 className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Time Management Agent</h3>
              <p className="text-gray-400">Monitors your work patterns, suggests optimal time slots for tasks, and helps you keep up with deadlines effectively.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Bell className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Priority Assistant</h3>
              <p className="text-gray-400">Smart agent that analyzes task importance, adjusts priorities based on deadlines, and helps maintain optimal workflow.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile First & Data Driven Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Mobile First & Data Driven</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Smartphone className="w-10 h-10 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Mobile Excellence</h3>
              <p className="text-gray-400">Install as a PWA with offline support. Responsive design ensures a great experience on any device.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <BarChart3 className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Productivity Insights</h3>
              <p className="text-gray-400">Track task completion, analyze patterns, and monitor habit formation with detailed statistics.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1f4d] border-gray-700 hover:border-purple-500 transition-colors">
            <CardContent className="p-6">
              <Shield className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Customizable</h3>
              <p className="text-gray-400">End-to-end authentication keeps your data safe. Personalize with dark/light mode and themes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;