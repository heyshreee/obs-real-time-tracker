import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ fullScreen = true, className = "" }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#0B0E14]/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                    <p className="text-blue-500 font-medium animate-pulse text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
    );
};

export default Spinner;
