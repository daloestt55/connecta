import React, { useState } from "react";
import { GlassCard } from "@/app/components/design-system/GlassCard";
import { Button } from "@/app/components/design-system/Button";
import { Sparkles, Palette, Frame, Image as ImageIcon, Search, Lock, Crown, Zap, Star, Gift, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { 
  PAYMENT_METHODS, 
  createPaymentIntent, 
  processPayment, 
  addPurchasedItem,
  hasItem,
  formatPrice as utilFormatPrice,
  calculateDiscount
} from "@/app/utils/payments";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  type: "subscription" | "frame" | "theme" | "stickers" | "boost";
  color?: string;
  features?: string[];
  preview?: string;
  badge?: string;
  popular?: boolean;
  discount?: number; // percentage
}

export function Store() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = [
    { id: "all", label: "All Items", icon: Sparkles },
    { id: "subscription", label: "Premium", icon: Crown },
    { id: "frames", label: "Avatar Frames", icon: Frame },
    { id: "themes", label: "Profile Themes", icon: Palette },
    { id: "stickers", label: "Stickers", icon: Gift },
    { id: "boost", label: "Server Boosts", icon: Zap },
  ];

  // Store Items with real prices
  const items: StoreItem[] = [
    // Premium Subscriptions
    {
      id: "premium-monthly",
      name: "Connecta Premium",
      description: "Full access to premium features",
      price: 499, // $4.99
      currency: "USD",
      type: "subscription",
      color: "from-purple-600 to-blue-600",
      badge: "Monthly",
      popular: true,
      features: [
        "Custom profile themes",
        "Animated avatars",
        "Larger file uploads (100MB)",
        "HD video & screen share",
        "Premium sticker packs",
        "Server boost discount",
        "Custom emoji anywhere",
        "Profile badge"
      ]
    },
    {
      id: "premium-yearly",
      name: "Connecta Premium Yearly",
      description: "Best value - Save 20%",
      price: 4799, // $47.99 (save ~$12)
      currency: "USD",
      type: "subscription",
      color: "from-yellow-600 to-purple-600",
      badge: "Yearly",
      discount: 20,
      features: [
        "All Premium features",
        "2 free server boosts",
        "Exclusive yearly badge",
        "Priority support",
        "Early access to new features"
      ]
    },

    // Avatar Frames
    {
      id: "frame-neon",
      name: "Neon Glow",
      description: "Animated neon frame",
      price: 299,
      currency: "USD",
      type: "frame",
      color: "from-cyan-500 via-pink-500 to-yellow-500",
      preview: "neon"
    },
    {
      id: "frame-cosmic",
      name: "Cosmic Star",
      description: "Spinning stars effect",
      price: 299,
      currency: "USD",
      type: "frame",
      color: "from-purple-900 via-blue-500 to-purple-900",
      preview: "cosmic"
    },
    {
      id: "frame-fire",
      name: "Fire Ring",
      description: "Burning flames animation",
      price: 399,
      currency: "USD",
      type: "frame",
      color: "from-red-600 via-orange-500 to-yellow-400",
      badge: "Hot",
      preview: "fire"
    },
    {
      id: "frame-ice",
      name: "Ice Crystal",
      description: "Frozen ice particles",
      price: 399,
      currency: "USD",
      type: "frame",
      color: "from-blue-400 via-cyan-300 to-blue-200",
      preview: "ice"
    },

    // Profile Themes
    {
      id: "theme-dark-purple",
      name: "Dark Purple",
      description: "Elegant purple gradient",
      price: 199,
      currency: "USD",
      type: "theme",
      color: "from-purple-900 to-black",
      preview: "dark-purple"
    },
    {
      id: "theme-ocean",
      name: "Ocean Waves",
      description: "Deep blue ocean theme",
      price: 199,
      currency: "USD",
      type: "theme",
      color: "from-blue-900 via-teal-700 to-black",
      preview: "ocean"
    },
    {
      id: "theme-sunset",
      name: "Sunset Vibes",
      description: "Warm sunset colors",
      price: 249,
      currency: "USD",
      type: "theme",
      color: "from-orange-500 via-pink-500 to-purple-900",
      badge: "New",
      preview: "sunset"
    },

    // Sticker Packs
    {
      id: "stickers-emoji-1",
      name: "Emoji Pack Pro",
      description: "50 premium emojis",
      price: 149,
      currency: "USD",
      type: "stickers",
      color: "from-yellow-400 to-orange-500",
      preview: "emoji"
    },
    {
      id: "stickers-animated",
      name: "Animated Stickers",
      description: "30 animated stickers",
      price: 199,
      currency: "USD",
      type: "stickers",
      color: "from-pink-500 to-purple-500",
      badge: "Animated",
      preview: "animated"
    },
    {
      id: "stickers-memes",
      name: "Meme Pack",
      description: "Popular meme stickers",
      price: 99,
      currency: "USD",
      type: "stickers",
      color: "from-green-500 to-blue-500",
      popular: true,
      preview: "memes"
    },

    // Server Boosts
    {
      id: "boost-1",
      name: "Server Boost",
      description: "Boost any server for 1 month",
      price: 299,
      currency: "USD",
      type: "boost",
      color: "from-pink-500 to-purple-600",
      features: [
        "Unlock server perks",
        "Improved audio quality",
        "More emoji slots",
        "Custom server banner",
        "HD video streaming"
      ]
    },
    {
      id: "boost-bundle",
      name: "Boost Bundle (3x)",
      description: "3 server boosts - Save 25%",
      price: 699,
      currency: "USD",
      type: "boost",
      color: "from-purple-600 to-pink-500",
      discount: 25,
      popular: true,
      features: [
        "All boost benefits",
        "25% discount",
        "Transfer between servers"
      ]
    }
  ];

  const formatPrice = (cents: number, currency: string) => {
    return utilFormatPrice(cents, currency);
  };

  const calculateDiscountedPrice = (item: StoreItem) => {
    if (!item.discount) return item.price;
    return calculateDiscount(item.price, item.discount);
  };

  const handlePurchase = (item: StoreItem) => {
    // Check if already owned
    if (hasItem(item.id)) {
      toast.info("You already own this item!");
      return;
    }
    setSelectedItem(item);
    setSelectedPaymentMethod("card");
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!selectedItem || isProcessing) return;

    setIsProcessing(true);

    try {
      // Create payment intent
      toast.loading("Processing payment...");
      
      const finalPrice = selectedItem.discount 
        ? calculateDiscount(selectedItem.price, selectedItem.discount)
        : selectedItem.price;

      const paymentIntent = await createPaymentIntent(
        selectedItem.id,
        selectedItem.name,
        finalPrice,
        selectedItem.currency,
        selectedPaymentMethod
      );

      // Process payment
      const result = await processPayment(paymentIntent.id, selectedPaymentMethod);

      toast.dismiss();

      if (result.success) {
        // Add to purchased items
        addPurchasedItem({
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          itemType: selectedItem.type,
          price: finalPrice,
          currency: selectedItem.currency,
          active: true
        });

        toast.success(`Successfully purchased ${selectedItem.name}!`, {
          description: "Item added to your inventory."
        });
        
        setShowCheckout(false);
        setSelectedItem(null);
      } else {
        toast.error("Payment failed", {
          description: result.error || "Please try again or use a different payment method."
        });
      }
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred", {
        description: "Please try again later."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items
    .filter(i => activeCategory === "all" || i.type === activeCategory)
    .filter(i => searchQuery === "" || i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white mb-1">Store</h1>
           <p className="text-gray-400 text-sm">Customize your experience with premium items</p>
        </div>
        
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <input 
             type="text" 
             placeholder="Search items..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 w-64"
           />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeCategory === cat.id 
                ? "bg-white text-black" 
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-12 pr-2">
         {filteredItems.map((item) => (
           <div key={item.id} className="group relative">
             <GlassCard className={cn(
               "p-6 h-auto flex flex-col hover:bg-white/10 transition-all duration-300 border-white/5 relative overflow-hidden",
               item.popular && "border-2 border-yellow-500/50"
             )}>
                {/* Popular Badge */}
                {item.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    <Star className="w-3 h-3 inline mr-1" />
                    POPULAR
                  </div>
                )}

                {/* Badge */}
                {item.badge && !item.popular && (
                  <div className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-lg border border-blue-500/30">
                    {item.badge}
                  </div>
                )}

                {/* Preview Area */}
                <div className="flex-1 w-full flex items-center justify-center relative mb-6">
                   <div className={cn(
                     "w-32 h-32 rounded-2xl bg-gradient-to-br opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 shadow-2xl",
                     item.color
                   )} />
                </div>

                {/* Info */}
                <div className="w-full mb-4">
                   <h3 className="text-white font-bold text-lg mb-1">{item.name}</h3>
                   <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                   
                   {/* Features */}
                   {item.features && item.features.length > 0 && (
                     <div className="space-y-1 mb-4">
                       {item.features.slice(0, 4).map((feature, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                           <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                           <span>{feature}</span>
                         </div>
                       ))}
                       {item.features.length > 4 && (
                         <div className="text-xs text-blue-400 mt-2">
                           +{item.features.length - 4} more features
                         </div>
                       )}
                     </div>
                   )}

                   {/* Price */}
                   <div className="flex items-center gap-2">
                     {item.discount ? (
                       <>
                         <span className="text-gray-500 line-through text-sm">
                           {formatPrice(item.price, item.currency)}
                         </span>
                         <span className="text-2xl font-bold text-white">
                           {formatPrice(calculateDiscountedPrice(item), item.currency)}
                         </span>
                         <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">
                           -{item.discount}%
                         </span>
                       </>
                     ) : (
                       <span className="text-2xl font-bold text-white">
                         {formatPrice(item.price, item.currency)}
                       </span>
                     )}
                     {item.type === "subscription" && (
                       <span className="text-gray-400 text-sm">
                         /{item.badge?.toLowerCase() || 'month'}
                       </span>
                     )}
                   </div>
                </div>

                {/* Button */}
                <Button 
                  onClick={() => handlePurchase(item)}
                  className={cn(
                    "w-full shadow-xl font-bold",
                    item.popular && "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  )}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Purchase
                </Button>
             </GlassCard>
           </div>
         ))}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-[#18181b] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">
              Complete Purchase
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6 pt-4">
              {/* Item Summary */}
              <div className="bg-[#0A0A0C] rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-20 h-20 rounded-xl bg-gradient-to-br flex-shrink-0",
                    selectedItem.color
                  )} />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{selectedItem.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{selectedItem.description}</p>
                    <div className="flex items-center gap-2">
                      {selectedItem.discount ? (
                        <>
                          <span className="text-gray-500 line-through">
                            {formatPrice(selectedItem.price, selectedItem.currency)}
                          </span>
                          <span className="text-xl font-bold text-white">
                            {formatPrice(calculateDiscountedPrice(selectedItem), selectedItem.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {formatPrice(selectedItem.price, selectedItem.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase">Payment Method</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={cn(
                        "w-full border rounded-xl p-4 flex items-center gap-3 transition-all",
                        selectedPaymentMethod === method.id
                          ? "bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      )}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-white font-medium flex-1 text-left">{method.label}</span>
                      {selectedPaymentMethod === method.id && (
                        <Check className="w-5 h-5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 bg-white/5 rounded-lg p-3">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
                All sales are final. Subscriptions will auto-renew unless cancelled.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowCheckout(false);
                    setSelectedItem(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Complete Purchase"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
