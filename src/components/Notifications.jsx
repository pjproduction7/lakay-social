import React from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';

export default function Notifications({ notifications, removeNotification, cardBg='bg-white' }) {
  return (
    <div>
      <div className={`${cardBg} rounded-xl p-4 shadow mb-4 flex items-center justify-between`}>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Recent Notifications</h3>
          <p className="text-sm text-gray-600">Stay up to date with everything happening on Lakay.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => notifications.length && removeNotification('all')}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={`${cardBg} rounded-xl p-8 text-center shadow`}> 
          <Bell size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600 font-semibold">No notifications yet. We will let you know when something happens!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div key={notif.id} className={`${cardBg} rounded-xl p-4 shadow flex items-start gap-3`}>
              <Bell size={20} className="text-yellow-500 mt-1" />
              <div className="flex-1">
                <p className="text-gray-900 font-semibold">{notif.text}</p>
                <p className="text-xs text-gray-500">{new Date(notif.id).toLocaleString()}</p>
              </div>
              {notif.actionLabel && (
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 rounded-lg bg-gray-100 text-sm"
                    onClick={() => {
                      try {
                        notif.action && notif.action();
                      } catch (e) {
                        console.error('Notification action failed', e);
                      }
                      removeNotification(notif.id);
                    }}
                  >{notif.actionLabel}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Notifications.propTypes = {
  notifications: PropTypes.array.isRequired,
  removeNotification: PropTypes.func.isRequired,
};