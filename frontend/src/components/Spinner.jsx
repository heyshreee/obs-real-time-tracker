import React from 'react';

const Spinner = ({ fullScreen = true }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-gray-900/80 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default Spinner;
