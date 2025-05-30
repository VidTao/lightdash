interface PlatformInfoCardProps {
  title: string;
  subtitle: string;
  image?: string;
  items: string[];
  isSelected: boolean;
  onClick: () => void;
}

const PlatformInfoCard = ({ 
  title, 
  subtitle, 
  image, 
  items,
  isSelected,
  onClick 
}: PlatformInfoCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-lg shadow-lg p-6 
                transform transition-all duration-300 hover:-translate-y-1 
                cursor-pointer
                ${isSelected 
                  ? 'ring-2 ring-blue-500 shadow-xl' 
                  : 'hover:shadow-xl'}`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        {image && (
          <img src={image} alt="" className="w-8 h-8" />
        )}
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{subtitle}</p>
      <ul className="space-y-2">
        {items.map((item, itemIndex) => (
          <li key={itemIndex} className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              isSelected ? 'bg-blue-500' : 'bg-gray-400'
            }`}></span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlatformInfoCard;