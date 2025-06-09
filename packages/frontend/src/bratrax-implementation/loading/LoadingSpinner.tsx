import { ClipLoader } from "react-spinners";

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div style={{ position: "relative", zIndex: 100000 }}>
        <ClipLoader
          color="#3498db"
          size={50}
          loading={true}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;
