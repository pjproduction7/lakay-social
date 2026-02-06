import React from 'react';
import PropTypes from 'prop-types';

export default function OnboardingCard({ pendingProfileSteps, percent, onFinish, onHide, cardBg }) {
  return (
    <div className={`${cardBg} rounded-2xl p-5 shadow-xl border border-white/10 mb-6`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-white/70 font-semibold">Complete your profile</p>
            <h3 className="text-3xl font-black text-white">{percent}% done</h3>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-4">
          <div>
            {pendingProfileSteps.length === 0 ? (
              <p className="text-white/70 text-sm">All steps completed. Great job!</p>
            ) : (
              <ul className="space-y-2 text-sm text-white/90">
                {pendingProfileSteps.slice(0, 3).map((step) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <span className="text-yellow-300">•</span>
                    <span>{step.label}</span>
                  </li>
                ))}
                {pendingProfileSteps.length > 3 && (
                  <li className="text-xs text-white/60">+{pendingProfileSteps.length - 3} more</li>
                )}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-[160px]">
            <button onClick={onFinish} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl">
              Finish profile
            </button>
            <button onClick={onHide} className="bg-transparent border border-white/20 text-white/80 hover:text-white font-semibold py-2.5 rounded-xl">
              Hide tip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

OnboardingCard.propTypes = {
  pendingProfileSteps: PropTypes.array.isRequired,
  percent: PropTypes.number.isRequired,
  onFinish: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  cardBg: PropTypes.string,
};

OnboardingCard.defaultProps = {
  cardBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
};
