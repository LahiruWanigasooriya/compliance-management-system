import React from 'react';

type Activity = {
    type: string;
    action: string;
    case: string;
    details: string;
    time: string;
    user: string;
}
const ActivityFeedPanel = ({ activities }: { activities: Activity[] }) => {
    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Team actions log</p>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className={`h-2 w-2 mt-2 rounded-full flex-shrink-0 ${activity.type === 'regulatory' ? 'bg-gray-600' :
                            activity.type === 'escalation' ? 'bg-black' :
                                activity.type === 'watchlist' ? 'bg-gray-800' :
                                    activity.type === 'block' ? 'bg-black' :
                                        'bg-gray-500'
                            }`}></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-600 mt-1">{activity.case}</p>
                            <p className="text-xs text-gray-700 mt-1">{activity.details}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">{activity.user}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeedPanel;