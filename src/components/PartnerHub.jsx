import React from 'react';
import PropTypes from 'prop-types';

export default function PartnerHub({ pushNotif }) {
  const spotlightStats = [
    { label: 'Active diaspora members', value: '25k+' },
    { label: 'Avg. daily impressions', value: '180k' },
    { label: 'Countries represented', value: '32' },
  ];

  const ctaSections = [
    {
      title: 'Advertise With Lakay',
      emoji: '📣',
      description:
        'Promote your brand to Haitians at home and abroad with native placements, sponsored stories, and live activations.',
      bullets: [
        'Hero takeovers and in-feed sponsorships',
        'Segmented messaging by diaspora city or Haitian department',
        'Weekly performance recap with actionable next steps',
      ],
      actionLabel: 'Request media kit',
      actionLink: 'mailto:ads@lakaysocial.com',
      note: 'ads@lakaysocial.com',
    },
    {
      title: 'Contact Our Team',
      emoji: '💬',
      description:
        'Need support, press materials, or a custom partnership idea? Our core team replies within one business day.',
      bullets: [
        'Chat with a bilingual community manager',
        'Schedule a product demo via Zoom',
        'Get help migrating your existing community',
      ],
      actionLabel: 'Book a call',
      actionLink: 'https://cal.com/lakay-team/30min',
      note: 'hello@lakaysocial.com',
    },
    {
      title: 'Join & Collaborate',
      emoji: '🌱',
      description:
        'From non-profits to student leaders, we welcome people who want to build unity across Ayiti and the diaspora.',
      bullets: [
        'Community moderators & ambassadors',
        'University + alumni chapter pilots',
        'Joint hackathons, livestreams, and pop-up labs',
      ],
      actionLabel: 'Apply to collaborate',
      actionLink: 'mailto:partners@lakaysocial.com',
      note: 'partners@lakaysocial.com',
    },
  ];

  const contactTiles = [
    { label: 'Media & ads', value: 'ads@lakaysocial.com' },
    { label: 'Partnerships', value: 'partners@lakaysocial.com' },
    { label: 'Community care', value: '+1 (786) 555-2034' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700 rounded-2xl p-6 shadow-2xl border border-white/10">
        <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">Grow with the Lakay network</p>
        <h2 className="text-3xl font-black text-white mb-3">Advertise, connect, and build with Haitians everywhere</h2>
        <p className="text-white/80 text-lg mb-6">Pick the path that fits your goal—brand awareness, community engagement, or strategic partnerships.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {spotlightStats.map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <p className="text-white/70 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {ctaSections.map((section) => (
        <section key={section.title} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="text-4xl mb-3">{section.emoji}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{section.title}</h3>
              <p className="text-white/70 mb-4 leading-relaxed">{section.description}</p>
              <ul className="space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-white/85"><span className="text-green-400">✔</span><span>{bullet}</span></li>
                ))}
              </ul>
            </div>
            <div className="md:w-60 space-y-3">
              <a
                href={section.actionLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => pushNotif?.('✉️ We just opened a new conversation')}
                className="block text-center w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition"
              >
                {section.actionLabel}
              </a>
              <div className="text-white/60 text-sm text-center border border-white/10 rounded-xl py-2 px-3">{section.note}</div>
            </div>
          </div>
        </section>
      ))}

      <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
        <h4 className="text-white text-xl font-semibold mb-4">Quick contacts</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {contactTiles.map((tile) => (
            <div key={tile.label} className="bg-white/5 rounded-xl p-4 border border-white/5 text-white">
              <p className="text-xs uppercase tracking-wide text-white/50 mb-1">{tile.label}</p>
              <p className="text-lg font-semibold break-all">{tile.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

PartnerHub.propTypes = {
  pushNotif: PropTypes.func.isRequired,
};