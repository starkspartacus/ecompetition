export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-16 w-16 text-white mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <h2 className="text-white text-2xl font-semibold">Chargement...</h2>
        <p className="text-white mt-2">Veuillez patienter un moment</p>
      </div>
    </div>
  );
}
