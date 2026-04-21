// components/ItemCard.tsx
interface ItemCardProps {
  title: string;
  description?: string;
  image?: string; // This handles post.image_url
  footer?: React.ReactNode;
  badge?: string;
}

export default function ItemCard({ title, description, image, footer, badge }: ItemCardProps) {
  return (
    <div className="bg-[#39455fd4] border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
      
      {/* 1. IMAGE SECTION */}
      {image && (
        <div className="w-full h-72 bg-gray-100 overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
      )}

      {/* 2. CONTENT SECTION */}
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-3xl font-black leading-tight tracking-tighter text-white uppercase">
            {title}
          </h3>
          {badge && (
            <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <div className="text-gray-200 text-sm leading-relaxed line-clamp-4 mb-6">
            {description}
          </div>
        )}

        {/* 3. FOOTER SECTION */}
        {footer && (
          <div className="pt-6 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
