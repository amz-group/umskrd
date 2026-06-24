import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  Brain,
  Send,
  BookOpen,
  TrendingUp,
  Calendar,
  Briefcase,
  Plus,
  User,
  Bot,
  RefreshCw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const quickPrompts = [
  { icon: BookOpen, text: 'ai.suggestCourses', prompt: 'Can you recommend courses for next semester based on my progress?' },
  { icon: TrendingUp, text: 'ai.analyzeGrades', prompt: 'Analyze my grade performance and suggest improvements.' },
  { icon: Calendar, text: 'ai.scheduling', prompt: 'Help me plan my study schedule for this week.' },
  { icon: Briefcase, text: 'ai.careerAdvice', prompt: 'What career paths can I pursue with my current degree?' },
];

const aiResponses: Record<string, string> = {
  default: "I'm your AI Academic Assistant! I can help you with course recommendations, grade analysis, study tips, and career advice. What would you like to know?",
  courses: "Based on your current progress in Computer Science, I recommend:\n\n1. **Data Structures** - Core requirement, builds on your programming foundations\n2. **Database Systems** - Essential for modern software development\n3. **Software Engineering** - Great for practical skills\n4. **Machine Learning Basics** - Elective that aligns with your interests\n\nWould you like more details about any of these courses?",
  grades: "Here's an analysis of your academic performance:\n\n**Strengths:**\n- Strong performance in programming courses (A average)\n- Good grasp of mathematical concepts\n\n**Areas for Improvement:**\n- Consider more practice with algorithms\n- Group project collaboration could be enhanced\n\n**Recommendations:**\n- Join study groups for complex topics\n- Utilize office hours for clarification\n- Practice coding challenges regularly",
  schedule: "Here's an optimized study schedule for you:\n\n**Morning (8:00 - 12:00):**\n- Lectures and new concepts\n- Active note-taking\n\n**Afternoon (14:00 - 17:00):**\n- Practice problems\n- Lab work\n- Assignment work\n\n**Evening (19:00 - 21:00):**\n- Review and revision\n- Reading and research\n\nWould you like me to customize this further?",
  career: "Based on your Computer Science degree with good grades, here are career paths to consider:\n\n**Software Development:**\n- Front-end Developer\n- Back-end Developer\n- Full-stack Engineer\n\n**Specialized Fields:**\n- Data Scientist\n- Machine Learning Engineer\n- DevOps Engineer\n\n**Other Options:**\n- Technical Consultant\n- Product Manager\n- Research Scientist\n\nWhich area interests you most?",
};

export default function AIAssistantPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: aiResponses.default,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    setTimeout(() => {
      let response = aiResponses.default;
      const lowerInput = inputMessage.toLowerCase();

      if (lowerInput.includes('course') || lowerInput.includes('recommend')) {
        response = aiResponses.courses;
      } else if (lowerInput.includes('grade') || lowerInput.includes('performance') || lowerInput.includes('analyze')) {
        response = aiResponses.grades;
      } else if (lowerInput.includes('schedule') || lowerInput.includes('plan') || lowerInput.includes('study')) {
        response = aiResponses.schedule;
      } else if (lowerInput.includes('career') || lowerInput.includes('job') || lowerInput.includes('path')) {
        response = aiResponses.career;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: aiResponses.default,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('ai.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Powered by AI to help with your academics
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={startNewChat}>
          {t('ai.newChat')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ai.history')}
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="p-4 space-y-4">
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <prompt.icon className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {t(prompt.text)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Academic Assistant
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Online • Ready to help
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'assistant'
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'assistant'
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardBody>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Input
                  placeholder={t('ai.placeholder')}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  icon={<Send className="w-4 h-4" />}
                >
                  {t('submit')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
