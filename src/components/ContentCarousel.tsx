import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  rating?: number;
  duration?: string;
  trending?: boolean;
  year?: number;
  type?: "pyq" | "mock";
}

interface ContentCarouselProps {
  title: string;
  items: CarouselItem[];
  variant?: "default" | "large";
}

export const ContentCarousel = ({ title, items, variant = "default" }: ContentCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleItemClick = (item: CarouselItem) => {
    if (item.type === "mock") {
      navigate("/mock-tests");
    } else if (item.type === "pyq") {
      // Navigate to ChapterSelect with Physics as default subject
      navigate("/chapters/Physics");
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl font-bold text-foreground"
          >
            {title}
          </motion.h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll("left")} className="rounded-full border-border/50 hover:bg-muted/50">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll("right")} className="rounded-full border-border/50 hover:bg-muted/50">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="carousel-scroll">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex-shrink-0 ${variant === "large" ? "w-64 sm:w-80" : "w-40 sm:w-56"}`}
            >
              <div
                onClick={() => handleItemClick(item)}
                className="group relative glass-card rounded-xl overflow-hidden hover-lift cursor-pointer"
              >
                <div className={`relative ${variant === "large" ? "aspect-video" : "aspect-[3/4]"} overflow-hidden`}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                  {item.trending && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h4>
                  {item.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.subtitle}</p>}
                  
                  {item.duration && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
