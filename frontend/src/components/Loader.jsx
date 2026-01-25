import { Loader2 } from 'lucide-react';

export default function Loader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-blue-500 font-medium animate-pulse text-sm">Loading...</p>
            </div>
        </div>
    );
}
