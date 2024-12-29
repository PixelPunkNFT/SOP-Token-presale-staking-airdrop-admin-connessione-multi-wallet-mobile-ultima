import React from 'react';
import { useMaintenance } from '../contexts/MaintenanceContext';
import { useNavigate, useLocation } from 'react-router-dom';

const MaintenancePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getMaintenanceInfo } = useMaintenance();
  
  // Estrai il nome della pagina dal pathname
  const pageName = location.pathname.split('/')[1] || 'home';
  const maintenanceInfo = getMaintenanceInfo(pageName);

  const formatTimeRemaining = (estimatedCompletion) => {
    if (!estimatedCompletion) return null;
    
    const remaining = new Date(estimatedCompletion) - new Date();
    if (remaining <= 0) return 'A breve';
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const timeRemaining = formatTimeRemaining(maintenanceInfo.estimatedCompletion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 text-gray-100">
      <div 
        className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 w-full max-w-md sm:max-w-3xl mx-auto text-center relative overflow-hidden"
        role="alert"
        aria-live="polite"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-red-500/10 z-0"></div>
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500">
          Under Maintenance
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            {maintenanceInfo.message || 'Questa pagina è temporaneamente in manutenzione. Torneremo presto online.'}
          </p>

          {timeRemaining && (
            <div className="mb-6 text-yellow-300">
              <p className="text-sm sm:text-base">
              Estimated Time: <span className="font-semibold">{timeRemaining}</span>
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center space-x-2 text-yellow-300 bg-yellow-500/10 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>We are working to improve the service</span>
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Torna alla home"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
