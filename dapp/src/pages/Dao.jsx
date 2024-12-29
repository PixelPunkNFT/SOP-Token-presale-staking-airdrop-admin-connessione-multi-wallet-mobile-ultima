import React from 'react';
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenancePage from '../components/MaintenancePage';


function Dao() {
  const { isPageUnderMaintenance } = useMaintenance();
  
  if (isPageUnderMaintenance('dao')) {
    return <MaintenancePage />;
  }

  
  return (
    
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-700/20 select-none p-4 text-center">
        COMING SOON
      </h1>
    </div>
  );
}

export default Dao;
