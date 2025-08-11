import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Bot, Zap, Heart, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
  userName?: string;
}

export default function WelcomeScreen({ onComplete, userName }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const welcomeSteps = [
    {
      icon: Bot,
      title: "Welcome to BeeBot",
      subtitle: userName ? `Hello ${userName}!` : "Your AI Assistant",
      description: "I'm here to help you with creative writing, data analysis, learning, and programming tasks."
    },
    {
      icon: Sparkles,
      title: "Powered by AI",
      subtitle: "Advanced Intelligence",
      description: "I use cutting-edge AI technology to provide thoughtful, accurate responses tailored to your needs."
    },
    {
      icon: Zap,
      title: "Smart Tools",
      subtitle: "Research & Analysis",
      description: "Access real-time web search, weather forecasts, and deep research capabilities when you need them."
    },
    {
      icon: Heart,
      title: "Ready to Help",
      subtitle: "Let's Get Started",
      description: "Ask me anything, and I'll provide helpful, detailed responses in simple, everyday language."
    }
  ];

  useEffect(() => {
    if (currentStep < welcomeSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, welcomeSteps.length]);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          {/* Background Animated Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full opacity-20"
                animate={{
                  x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                  y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
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

          <Card className="relative max-w-lg mx-4 p-8 text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Icon */}
              <motion.div 
                variants={iconVariants}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
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
                    <Sparkles className="w-3 h-3 text-yellow-700" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div variants={textVariants} className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentWelcome.title}
                  </h1>
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-4">
                    {currentWelcome.subtitle}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {currentWelcome.description}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center space-x-2 py-4">
                  {welcomeSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentStep 
                          ? "bg-blue-600 dark:bg-blue-400" 
                          : "bg-gray-300 dark:bg-gray-600"
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
                    />
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                variants={itemVariants}
                className="flex justify-center space-x-4 pt-4"
              >
                {currentStep < welcomeSteps.length - 1 ? (
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    data-testid="button-skip"
                  >
                    Skip Introduction
                  </Button>
                ) : (
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-get-started"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </motion.div>
            </motion.div>
          </Card>

          {/* Version Badge */}
          <motion.div
            className="absolute bottom-8 right-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              BeeBot v1.0
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}