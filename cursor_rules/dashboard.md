import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  MessageCircle,
  Settings,
  History,
  TrendingUp,
  Clock,
  Eye,
  Send,
  Bot,
  BarChart3,
  Star,
  Globe,
  ShoppingBag,
  Gamepad2,
  Music,
  Video,
  BookOpen,
  Briefcase,
  Heart,
  Camera,
  Car,
  Home,
  Utensils,
  Plane,
  Smartphone,
  Monitor,
  Headphones,
  Coffee,
  Gift,
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Zap,
  Target,
  Award,
  Lightbulb,
  Bookmark,
  Flag,
  Bell,
  Mail,
  Phone,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Menu,
  Grid,
  List,
  Layout,
  Maximize,
  Minimize,
  RotateCcw,
  Trash2,
  Edit,
  Copy,
  Save,
  Upload,
  FileText,
  Image,
  Folder,
  Archive,
  Database,
  Server,
  Cloud,
  Wifi,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Mic,
  MicOff,
  Lock,
  Unlock,
  Shield,
  Key,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
  Power,
  Loader,
  CircleDot,
  Square,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Octagon,
  Smile,
  Frown,
  Meh,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Snowflake,
  Umbrella,
  Thermometer,
  Wind
} from "lucide-react";

// Utility function
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

// Auto-resize textarea hook
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// Animated Radial Chart Component
interface AnimatedRadialChartProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabels?: boolean;
  duration?: number;
}

function AnimatedRadialChart({ 
  value = 74, 
  size = 200,
  strokeWidth: customStrokeWidth,
  className,
  showLabels = false,
  duration = 2
}: AnimatedRadialChartProps) {
  const strokeWidth = customStrokeWidth ?? Math.max(8, size * 0.06);
  const radius = size * 0.35;
  const center = size / 2;
  const circumference = Math.PI * radius;

  const animatedValue = useMotionValue(0);
  const offset = useTransform(animatedValue, [0, 100], [circumference, 0]);

  useEffect(() => {
    const controls = animate(animatedValue, value, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, animatedValue, duration]);

  const fontSize = Math.max(12, size * 0.08);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
        <defs>
          <linearGradient id={`baseGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`progressGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>

        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={`url(#baseGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />

        <motion.path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={`url(#progressGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="font-bold tracking-tight mt-6 text-gray-700"
          style={{ fontSize: `${fontSize}px` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: duration * 0.75 }}
        >
          <motion.span>{useTransform(animatedValue, (latest) => Math.round(latest))}</motion.span>%
        </motion.div>
      </div>
    </div>
  );
}

// Chatbot Component
interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm SofIA's assistant. How can I help you analyze your browsing patterns?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 40,
    maxHeight: 120,
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    adjustHeight(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I can help you understand your browsing habits better. Would you like me to explain any specific metric?",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>SofIA Assistant</h3>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              message.isBot 
                ? 'bg-gray-100 text-gray-900' 
                : 'bg-blue-500 text-white'
            }`}>
              <p className="text-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ fontFamily: 'Verdana, sans-serif', minHeight: '40px' }}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export function SofIADashboard() {
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  // Mock data
  const visitCount = 1247;
  const averageDuration = "2m 34s";
  const topKeywords = ["React", "TypeScript", "Design"];
  
  const websiteCategories = [
    { name: "Development", value: 35, color: "#3b82f6" },
    { name: "Social Media", value: 25, color: "#ef4444" },
    { name: "News", value: 20, color: "#10b981" },
    { name: "Entertainment", value: 15, color: "#f59e0b" },
    { name: "Other", value: 5, color: "#8b5cf6" },
  ];

  const recommendations = [
    "Consider taking breaks every 30 minutes when browsing development sites",
    "Your social media usage has increased by 15% this week",
    "Try exploring more educational content based on your interests",
    "Set up focus time blocks for better productivity",
  ];

  const historyItems = [
    { url: "github.com/user/project", title: "GitHub Repository", time: "2 hours ago", duration: "15m" },
    { url: "stackoverflow.com", title: "Stack Overflow", time: "3 hours ago", duration: "8m" },
    { url: "react.dev", title: "React Documentation", time: "4 hours ago", duration: "22m" },
    { url: "tailwindcss.com", title: "Tailwind CSS", time: "5 hours ago", duration: "12m" },
  ];

  // Calculate total for pie chart
  const total = websiteCategories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="min-h-screen bg-white p-6" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SofIA</h1>
          <p className="text-gray-600">Smart Analytics Dashboard</p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Visit Count */}
          <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Visits</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{visitCount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>

          {/* Average Duration */}
          <div className="bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Avg Duration</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{averageDuration}</p>
            <p className="text-sm text-gray-600">Per session</p>
          </div>

          {/* Top Keywords */}
          <div className="bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Top Keywords</h3>
            </div>
            <div className="space-y-2">
              {topKeywords.map((keyword, index) => (
                <div key={keyword} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{index + 1}.</span>
                  <span className="text-sm text-gray-900">{keyword}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chatbot */}
          <div className="lg:col-span-1">
            <div className="shadow-lg rounded-xl">
              <ChatBot />
            </div>
          </div>

          {/* Website Categories Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 h-full shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Website Categories</h3>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative">
                  <AnimatedRadialChart value={75} size={250} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="250" height="175" viewBox="0 0 250 175" className="overflow-visible">
                      {websiteCategories.map((category, index) => {
                        const angle = (category.value / total) * Math.PI;
                        const startAngle = websiteCategories
                          .slice(0, index)
                          .reduce((sum, cat) => sum + (cat.value / total) * Math.PI, -Math.PI);
                        const endAngle = startAngle + angle;
                        const midAngle = startAngle + angle / 2;
                        
                        const innerRadius = 60;
                        const outerRadius = 85;
                        const centerX = 125;
                        const centerY = 125;
                        
                        const x1 = centerX + Math.cos(startAngle) * innerRadius;
                        const y1 = centerY + Math.sin(startAngle) * innerRadius;
                        const x2 = centerX + Math.cos(endAngle) * innerRadius;
                        const y2 = centerY + Math.sin(endAngle) * innerRadius;
                        const x3 = centerX + Math.cos(endAngle) * outerRadius;
                        const y3 = centerY + Math.sin(endAngle) * outerRadius;
                        const x4 = centerX + Math.cos(startAngle) * outerRadius;
                        const y4 = centerY + Math.sin(startAngle) * outerRadius;
                        
                        const largeArcFlag = angle > Math.PI ? 1 : 0;
                        
                        const pathData = [
                          `M ${x1} ${y1}`,
                          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          `L ${x3} ${y3}`,
                          `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                          'Z'
                        ].join(' ');
                        
                        return (
                          <path
                            key={category.name}
                            d={pathData}
                            fill={category.color}
                            opacity="0.8"
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                {websiteCategories.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <span className="text-sm font-medium text-gray-900">{category.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8 shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Dashboard Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Enable notifications</label>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Auto-refresh data</label>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Dark mode</label>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Refresh interval</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>5 minutes</option>
                        <option>10 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data retention</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>1 year</option>
                        <option>Forever</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Browsing History</h3>
                <div className="space-y-4">
                  {historyItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.url}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{item.time}</p>
                        <p className="text-sm font-medium text-gray-700">{item.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Suggested Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="w-screen min-h-screen flex justify-center items-center">
      <SofIADashboard />
    </div>
  );
}