import React, { createContext, useState, useContext, useEffect } from 'react';

const MaintenanceContext = createContext();

// Usa l'IP di rete invece di localhost
// const MAINTENANCE_SERVER = window.location.hostname === 'localhost' 
//   ? 'http://localhost:3001'
//   : `http://${window.location.hostname}:3001`;
const MAINTENANCE_SERVER = 'https://soptoken-maintenance-mode.onrender.com';


const getInitialState = () => ({
  presale: { active: false, message: '', startTime: null, estimatedCompletion: null },
  staking: { active: false, message: '', startTime: null, estimatedCompletion: null },
  airdrop: { active: false, message: '', startTime: null, estimatedCompletion: null },
  dao: { active: false, message: '', startTime: null, estimatedCompletion: null },
  swap: { active: false, message: '', startTime: null, estimatedCompletion: null }
});

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState(getInitialState);

  // Carica lo stato iniziale dal server
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const response = await fetch(`${MAINTENANCE_SERVER}/maintenance-status`);
        if (response.ok) {
          const data = await response.json();
          setMaintenanceStatus(data);
        }
      } catch (error) {
        console.error('Errore nel recupero dello stato di manutenzione:', error);
      }
    };

    fetchMaintenanceStatus();
    
    // Polling ogni 30 secondi per aggiornamenti
    const interval = setInterval(fetchMaintenanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setPageMaintenance = async (page, status, message = '', estimatedHours = null) => {
    console.log(`Setting ${page} maintenance to: ${status}`);
    
    const newStatus = {
      ...maintenanceStatus,
      [page]: {
        active: status,
        message: message,
        startTime: status ? new Date().toISOString() : null,
        estimatedCompletion: estimatedHours ? new Date(Date.now() + estimatedHours * 3600000).toISOString() : null
      }
    };

    try {
      const response = await fetch(`${MAINTENANCE_SERVER}/maintenance-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus)
      });

      if (response.ok) {
        setMaintenanceStatus(newStatus);
      } else {
        console.error('Errore nel salvataggio dello stato di manutenzione');
      }
    } catch (error) {
      console.error('Errore nella comunicazione con il server:', error);
    }
  };

  const isPageUnderMaintenance = (page) => {
    const status = maintenanceStatus[page]?.active || false;
    console.log(`Checking maintenance for ${page}: ${status}`);
    return status;
  };

  const getMaintenanceInfo = (page) => {
    return maintenanceStatus[page] || {
      active: false,
      message: '',
      startTime: null,
      estimatedCompletion: null
    };
  };

  return (
    <MaintenanceContext.Provider 
      value={{ 
        maintenanceStatus, 
        setPageMaintenance, 
        isPageUnderMaintenance,
        getMaintenanceInfo
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
