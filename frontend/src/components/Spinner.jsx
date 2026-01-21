import React from 'react';

const Spinner = ({ fullScreen = true, className = "" }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#0B0E14]/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-blue-500 font-medium animate-pulse text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default Spinner;
