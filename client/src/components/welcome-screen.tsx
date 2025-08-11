import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Bot, Zap, Heart, ArrowRight, Search, Cloud, Brain, MessageCircle, Smartphone, Tablet, Monitor } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
  userName?: string;
}

export default function WelcomeScreen({ onComplete, userName }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const welcomeSteps = [
    {
      icon: Bot,
      title: "Welcome to BeeBot",
      subtitle: userName ? `Hello ${userName}!` : "Your AI Assistant",
      description: "I'm here to help you with creative writing, data analysis, learning, and programming tasks.",
      features: ["Creative Writing", "Data Analysis", "Learning Support", "Code Assistance"]
    },
    {
      icon: Brain,
      title: "Powered by AI",
      subtitle: "Advanced Intelligence",
      description: "I use cutting-edge AI technology to provide thoughtful, accurate responses tailored to your needs.",
      features: ["DeepSeek AI", "Natural Language", "Context Awareness", "Smart Responses"]
    },
    {
      icon: Search,
      title: "Smart Tools",
      subtitle: "Research & Analysis", 
      description: "Access real-time web search, weather forecasts, and deep research capabilities when you need them.",
      features: ["Web Search", "Weather Data", "Deep Research", "Real-time Info"]
    },
    {
      icon: MessageCircle,
      title: "Native Experience",
      subtitle: "Everywhere You Go",
      description: "Optimized for mobile, tablet, and desktop with smooth animations and intuitive navigation.",
      features: ["Mobile Optimized", "Touch Friendly", "Offline Ready", "Fast & Smooth"]
    },
    {
      icon: Heart,
      title: "Ready to Help",
      subtitle: "Let's Get Started",
      description: "Ask me anything, and I'll provide helpful, detailed responses in simple, everyday language.",
      features: ["24/7 Available", "Simple Language", "Instant Responses", "Always Learning"]
    }
  ];

  useEffect(() => {
    if (currentStep < welcomeSteps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 4000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentStep, welcomeSteps.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && currentStep < welcomeSteps.length - 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCurrentStep(currentStep + 1);
      } else if (event.key === 'ArrowLeft' && currentStep > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCurrentStep(currentStep - 1);
      } else if (event.key === 'Escape') {
        handleSkip();
      } else if (event.key === 'Enter' && currentStep === welcomeSteps.length - 1) {
        handleGetStarted();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, welcomeSteps.length]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance && currentStep < welcomeSteps.length - 1) {
      // Swipe left - next step
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setCurrentStep(currentStep + 1);
    }

    if (distance < -minSwipeDistance && currentStep > 0) {
      // Swipe right - previous step  
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 300);
  };

  const handleGetStarted = () => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 300);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  const currentWelcome = welcomeSteps[currentStep];
  const IconComponent = currentWelcome.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="welcome-screen"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4 sm:p-6 lg:p-8"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          role="dialog"
          aria-label="Welcome to BeeBot"
          aria-modal="true"
        >
          {/* Background Animated Elements - Responsive */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-blue-400 dark:bg-blue-300 rounded-full opacity-20"
                animate={{
                  x: [Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800), Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800)],
                  y: [Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600), Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600)],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                }}
              />
            ))}
          </div>

          {/* Device Indicators */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex space-x-2 opacity-30">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 sm:hidden" />
            <Tablet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 hidden sm:block md:hidden" />
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 hidden md:block" />
          </div>

          <Card 
            className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 text-center bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl sm:rounded-3xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Icon - Responsive */}
              <motion.div 
                variants={iconVariants}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-700" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Content - Responsive Typography */}
              <motion.div variants={textVariants} className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    {currentWelcome.title}
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl font-medium text-blue-600 dark:text-blue-400">
                    {currentWelcome.subtitle}
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed px-2 sm:px-4">
                    {currentWelcome.description}
                  </p>
                </div>

                {/* Feature Tags - Mobile Responsive */}
                <motion.div 
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, staggerChildren: 0.1 }}
                >
                  {currentWelcome.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {feature}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Progress Indicator - Touch Friendly */}
                <div className="flex justify-center space-x-3 sm:space-x-4 py-4 sm:py-6">
                  {welcomeSteps.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                        index === currentStep 
                          ? "bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-300 dark:ring-blue-600" 
                          : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: index === currentStep ? 1.2 : 0.8,
                        backgroundColor: index === currentStep 
                          ? "#2563eb" 
                          : index < currentStep 
                            ? "#10b981" 
                            : "#d1d5db"
                      }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: index === currentStep ? 1.3 : 1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentStep(index)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons - Mobile First Design */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6"
              >
                {currentStep < welcomeSteps.length - 1 ? (
                  <>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      size="lg"
                      className="w-full sm:w-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-h-[48px] sm:min-h-[auto] text-base sm:text-sm"
                      data-testid="button-skip"
                    >
                      Skip Introduction
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] sm:min-h-[auto] text-base sm:text-sm"
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setCurrentStep(0)}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 min-h-[48px] sm:min-h-[auto] text-base sm:text-sm"
                      data-testid="button-replay"
                    >
                      Replay Tour
                    </Button>
                    <Button
                      onClick={handleGetStarted}
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] sm:min-h-[auto] text-base sm:text-sm"
                      data-testid="button-get-started"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </Card>

          {/* Version Badge - Responsive Position */}
          <motion.div
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="px-2 py-1 sm:px-3 sm:py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              BeeBot v1.0
            </div>
          </motion.div>

          {/* Navigation Hints */}
          <motion.div
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 sm:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, repeat: Infinity, duration: 2 }}
          >
            <div className="flex flex-col items-center text-gray-400 dark:text-gray-600">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-1"></div>
              <span className="text-xs">Swipe or tap to navigate</span>
            </div>
          </motion.div>

          {/* Desktop Keyboard Hints */}
          <motion.div
            className="absolute bottom-4 left-4 hidden sm:block text-xs text-gray-400 dark:text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
          >
            <div className="space-y-1">
              <div>← → Arrow keys to navigate</div>
              <div>ESC to skip • ENTER to start</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}