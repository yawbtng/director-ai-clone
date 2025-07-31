// components/browser-loading.tsx
const BrowserLoading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">
          Setting up your workspace...
        </p>
        <p className="text-sm text-gray-500">
          Please wait a moment while we prepare the browser session.
        </p>
      </div>
    </div>
  );
};

export default BrowserLoading;
