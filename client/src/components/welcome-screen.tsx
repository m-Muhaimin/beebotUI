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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-background dark:via-background dark:to-background p-4 sm:p-6 lg:p-8"
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
                className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-primary/40 rounded-full opacity-20"
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
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary sm:hidden" />
            <Tablet className="w-4 h-4 sm:w-5 sm:h-5 text-primary hidden sm:block md:hidden" />
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary hidden md:block" />
          </div>

          <Card 
            className="relative w-full max-w-xs sm:max-w-sm lg:max-w-lg mx-auto p-3 sm:p-4 lg:p-6 text-center bg-background/95 backdrop-blur-md border-0 shadow-xl rounded-xl sm:rounded-2xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 lg:space-y-5">
              {/* Icon - More Compact */}
              <motion.div 
                variants={iconVariants}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-xl flex items-center justify-center shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-foreground" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
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
                    <Sparkles className="w-2 h-2 text-yellow-700" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Content - Cleaner Typography */}
              <motion.div variants={textVariants} className="space-y-2 sm:space-y-3 lg:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {currentWelcome.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg font-medium text-primary">
                    {currentWelcome.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed px-1 sm:px-2">
                    {currentWelcome.description}
                  </p>
                </div>

                {/* Feature Tags - Compact Grid */}
                <motion.div 
                  className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3 sm:mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, staggerChildren: 0.05 }}
                >
                  {currentWelcome.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      className="bg-muted px-2 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {feature}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Progress Indicator - Compact */}
                <div className="flex justify-center space-x-2 py-3 sm:py-4">
                  {welcomeSteps.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                        index === currentStep 
                          ? "bg-primary" 
                          : "bg-muted-foreground hover:bg-muted-foreground/80"
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

              {/* Action Buttons - Compact Design */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-3"
              >
                {currentStep < welcomeSteps.length - 1 ? (
                  <>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground h-8 sm:h-9"
                      data-testid="button-skip"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-8 sm:h-9 text-xs sm:text-sm"
                      data-testid="button-next"
                    >
                      Next
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setCurrentStep(0)}
                      variant="outline"
                      size="sm"
                      className="border border-primary text-primary hover:bg-muted h-8 sm:h-9 text-xs sm:text-sm"
                      data-testid="button-replay"
                    >
                      Replay
                    </Button>
                    <Button
                      onClick={handleGetStarted}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-8 sm:h-9 text-xs sm:text-sm"
                      data-testid="button-get-started"
                    >
                      Get Started
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
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