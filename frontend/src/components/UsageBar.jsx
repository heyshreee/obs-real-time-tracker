export default function UsageBar({ used, limit, plan }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">
          {used.toLocaleString()} / {limit.toLocaleString()} views
        </span>
        <span className="text-gray-500 capitalize">{plan} Plan</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

