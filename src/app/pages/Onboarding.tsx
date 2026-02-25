import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/design-system/Button";
import { Shield, Radio, Smartphone, ChevronRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Shield className="w-16 h-16 text-teal-400" />,
      title: "Secure by Default",
      desc: "End-to-end encryption for every voice, video, and text signal. Your privacy is our priority.",
      bg: "bg-teal-500/10",
      glow: "shadow-[0_0_50px_rgba(20,184,166,0.2)]"
    },
    {
      icon: <Radio className="w-16 h-16 text-blue-400" />,
      title: "High Fidelity Signal",
      desc: "Experience crystal clear voice and video communication with our proprietary Living Signal technology.",
      bg: "bg-blue-500/10",
      glow: "shadow-[0_0_50px_rgba(59,130,246,0.2)]"
    },
    {
      icon: <Smartphone className="w-16 h-16 text-violet-400" />,
      title: "Seamless Handoff",
      desc: "Move fluidly between desktop and mobile without dropping the connection.",
      bg: "bg-violet-500/10",
      glow: "shadow-[0_0_50px_rgba(139,92,246,0.2)]"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="h-screen w-full bg-[#0A0A0C] flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">
        <div className="h-[400px] relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className={`w-32 h-32 rounded-full ${steps[step].bg} flex items-center justify-center mb-8 ${steps[step].glow} ring-1 ring-white/10`}>
                {steps[step].icon}
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">{steps[step].title}</h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm mx-auto">
                {steps[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-white" : "w-2 bg-white/20"}`} 
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="w-full max-w-xs" 
            onClick={handleNext}
            rightIcon={step === steps.length - 1 ? <ChevronRight className="w-4 h-4" /> : undefined}
          >
            {step === steps.length - 1 ? "Get Started" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
