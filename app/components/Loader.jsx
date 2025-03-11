import React from 'react';

const Loader = () => {
  return (
    <div style={styles.overlay}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.spinner}></div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#e3e3e3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTop: '4px solid #2172af',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default Loader;
