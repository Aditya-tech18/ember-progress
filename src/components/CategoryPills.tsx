import { useState } from "react";
import { motion } from "framer-motion";

const categories = [
  { id: "all", name: "All", active: true },
  { id: "physics", name: "Physics", active: false },
  { id: "chemistry", name: "Chemistry", active: false },
  { id: "maths", name: "Mathematics", active: false },
  { id: "pyqs", name: "PYQs", active: false },
  { id: "mock-tests", name: "Mock Tests", active: false },
  { id: "chapters", name: "Chapters", active: false },
];

export const CategoryPills = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <section className="py-6">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {category.name}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
