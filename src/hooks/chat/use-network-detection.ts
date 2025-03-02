
export function useNetworkDetection() {
  // Check if the network is available
  const isNetworkAvailable = (): boolean => {
    return navigator.onLine;
  };

  return {
    isNetworkAvailable
  };
}
