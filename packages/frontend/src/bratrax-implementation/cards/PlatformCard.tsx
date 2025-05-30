interface PlatformCardProps {
  handleLogin: () => void;
  isLoading: boolean;
  platformName: string;
  logoPath: string;
  description: string;
  isConnected?: boolean;
  handleNavigate?: () => void;
  connectedOn?: string;
}

const PlatformCard = ({
  handleLogin,
  isLoading,
  platformName,
  logoPath,
  description,
  isConnected,
  handleNavigate,
  connectedOn,
}: PlatformCardProps) => {

  return (
    <div
      onClick={isConnected ? handleNavigate : handleLogin}
      className={`
      relative overflow-hidden
      w-64 p-6 rounded-xl
      cursor-pointer
      bg-white shadow-lg
      hover:shadow-xl hover:-translate-y-1
      transform transition-all duration-300
      border ${isConnected ? 'border-green-200' : 'border-gray-100'}
      ${isLoading ? "opacity-70" : ""}
    `}
    >
      {/* Platform Icon */}
      <div className="h-[35px] mb-4 flex items-center">
        <img
          className="h-full w-auto object-contain"
          src={`/images/${logoPath}`}
          alt={platformName}
        />
      </div>

      {/* Platform Name */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {platformName}
        </h3>
        {isConnected && (
          <span className="text-green-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {/* Description */}
      <div className="text-sm text-gray-600 mb-4 flex flex-col gap-2">
        {isConnected ? (
          <>
            <span className="mb-1">Connected on: <span className="font-semibold">{connectedOn}</span></span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center gap-1">
                See connection details
                <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </>
        ) : description}
      </div>

      {/* Connect Button */}
      <div className={`flex items-center font-medium ${isConnected ? 'text-green-500' : 'text-blue-500'}`}>
        {isLoading ? "Connecting..." : (isConnected ? "Connected" : "Connect Account")}
        {!isConnected && (
          <svg
            className={`ml-2 w-4 h-4 ${isLoading ? "animate-spin" : "animate-bounce"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isLoading
                  ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  : "M13 7l5 5m0 0l-5 5m5-5H6"
              }
            />
          </svg>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className={`absolute inset-0 ${isConnected ? 'bg-green-50' : 'bg-blue-50'} opacity-0 hover:opacity-10 transition-opacity duration-300`} />
    </div>
  );
};

export default PlatformCard;
