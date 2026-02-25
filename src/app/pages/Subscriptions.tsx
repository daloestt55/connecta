import React, { useState, useEffect } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button } from "@/app/components/design-system/Button";
import { 
  Crown, Shield, Sparkles, Zap, Check, Upload, Video, Smile, 
  Star, Gift, Palette, Frame, Users, MessageSquare, X, Clock,
  Calendar, CreditCard, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getActiveSubscriptions, 
  cancelSubscription, 
  PurchasedItem,
  formatPrice 
} from "@/app/utils/payments";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

interface PremiumFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: "customization" | "performance" | "social" | "storage";
}

const premiumFeatures: PremiumFeature[] = [
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Custom Profile Themes",
    description: "Personalize your profile with exclusive themes and colors",
    category: "customization"
  },
  {
    icon: <Frame className="w-5 h-5" />,
    title: "Animated Avatars",
    description: "Use GIFs and animated images as your avatar",
    category: "customization"
  },
  {
    icon: <Smile className="w-5 h-5" />,
    title: "Custom Emoji Anywhere",
    description: "Use your custom emojis in any server",
    category: "social"
  },
  {
    icon: <Upload className="w-5 h-5" />,
    title: "Larger File Uploads",
    description: "Upload files up to 100MB (vs 8MB for free)",
    category: "storage"
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: "HD Video & Screen Share",
    description: "Stream in 1080p 60fps with enhanced quality",
    category: "performance"
  },
  {
    icon: <Gift className="w-5 h-5" />,
    title: "Premium Sticker Packs",
    description: "Access exclusive animated sticker collections",
    category: "social"
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Server Boost Discount",
    description: "Get 30% off all server boosts",
    category: "social"
  },
  {
    icon: <Crown className="w-5 h-5" />,
    title: "Premium Badge",
    description: "Show off your premium status with an exclusive badge",
    category: "social"
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Priority Support",
    description: "Get faster response times from our support team",
    category: "performance"
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Early Access",
    description: "Try new features before everyone else",
    category: "performance"
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Enhanced Message History",
    description: "Access unlimited message history",
    category: "storage"
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Premium Server Perks",
    description: "Unlock additional slots and features for your servers",
    category: "social"
  }
];

export function Subscriptions() {
  const [activeSubscription, setActiveSubscription] = useState<PurchasedItem | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "customization" | "performance" | "social" | "storage">("all");

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = () => {
    const subscriptions = getActiveSubscriptions();
    if (subscriptions.length > 0) {
      setActiveSubscription(subscriptions[0]);
    }
  };

  const handleCancelSubscription = () => {
    if (!activeSubscription) return;

    cancelSubscription(activeSubscription.itemId);
    toast.success("Subscription cancelled", {
      description: "You will retain access until the end of your billing period."
    });
    setActiveSubscription(null);
    setShowCancelDialog(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getDaysRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredFeatures = selectedCategory === "all" 
    ? premiumFeatures 
    : premiumFeatures.filter(f => f.category === selectedCategory);

  const categoryColors: Record<string, string> = {
    customization: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    performance: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    social: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    storage: "text-green-400 bg-green-500/10 border-green-500/20"
  };

  return (
    <div className="h-full overflow-y-auto p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Premium Subscription</h1>
          <p className="text-gray-400">Unlock exclusive features and elevate your experience</p>
        </div>

        {/* Active Subscription Card */}
        {activeSubscription ? (
          <GlassCard className="p-6 mb-8 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-purple-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{activeSubscription.itemName}</h2>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Premium features unlocked</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Price</span>
                </div>
                <div className="text-white font-bold">
                  {formatPrice(activeSubscription.price, activeSubscription.currency)}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Started</span>
                </div>
                <div className="text-white font-bold">
                  {formatDate(activeSubscription.purchasedAt)}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Renews</span>
                </div>
                {activeSubscription.expiresAt ? (
                  <div>
                    <div className="text-white font-bold">
                      {formatDate(activeSubscription.expiresAt)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getDaysRemaining(activeSubscription.expiresAt)} days remaining
                    </div>
                  </div>
                ) : (
                  <div className="text-white font-bold">Lifetime</div>
                )}
              </div>
            </div>
          </GlassCard>
        ) : (
          /* No Subscription - Call to Action */
          <GlassCard className="p-8 mb-8 text-center border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Get access to exclusive features, enhanced customization, and premium support for just $4.99/month
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-store'))}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Go to Store
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All Features", icon: Sparkles },
            { id: "customization", label: "Customization", icon: Palette },
            { id: "performance", label: "Performance", icon: Zap },
            { id: "social", label: "Social", icon: Users },
            { id: "storage", label: "Storage", icon: Upload }
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === category.id 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <category.icon className="w-4 h-4" />
              {category.label}
            </button>
          ))}
        </div>

        {/* Premium Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredFeatures.map((feature, index) => (
            <GlassCard 
              key={index}
              className={cn(
                "p-5 hover:bg-white/10 transition-all duration-300 border",
                activeSubscription 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-white/5"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  categoryColors[feature.category]
                )}>
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    {feature.title}
                    {activeSubscription && (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Benefits Summary */}
        {!activeSubscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 text-center">
              <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Enhanced Experience</h3>
              <p className="text-gray-400 text-sm">
                Unlock premium features that make your time on Connecta more enjoyable
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Priority Support</h3>
              <p className="text-gray-400 text-sm">
                Get faster help when you need it with dedicated premium support
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Exclusive Access</h3>
              <p className="text-gray-400 text-sm">
                Be the first to try new features and get exclusive premium content
              </p>
            </GlassCard>
          </div>
        )}

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="bg-[#18181b] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Cancel Subscription?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-gray-300">
                Are you sure you want to cancel your premium subscription? You will lose access to:
              </p>
              <ul className="space-y-2">
                {premiumFeatures.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-400 text-sm">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{feature.title}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  You will retain access until <strong>{activeSubscription?.expiresAt && formatDate(activeSubscription.expiresAt)}</strong>
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowCancelDialog(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Keep Premium
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
