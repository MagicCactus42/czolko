import { useState } from 'react';

interface ShareLinkProps {
  lobbyId: string;
  code: string;
}

export function ShareLink({ lobbyId, code }: ShareLinkProps) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const shareUrl = `${window.location.origin}/lobby/${lobbyId}`;

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Czolko game!',
          text: `Join my Czolko game with code: ${code}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        copyToClipboard(shareUrl, 'link');
      }
    } else {
      copyToClipboard(shareUrl, 'link');
    }
  };

  return (
    <div className="card animate-slide-up">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">🔗</span>
        Invite Friends
      </h3>

      <div className="space-y-4">
        {/* Share Link */}
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">
            Share Link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-white/5 text-white/80 rounded-lg px-4 py-2.5 text-sm border border-white/10 truncate"
            />
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className={`flex-1 sm:flex-none btn-ghost text-sm py-2.5 px-4 flex items-center justify-center gap-2 ${
                  copied === 'link' ? 'text-green-400 border-green-400/50' : ''
                }`}
              >
                {copied === 'link' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              {/* Native Share Button (mobile) */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  onClick={handleShare}
                  className="btn-primary text-sm py-2.5 px-4 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-purple-300/50 text-sm">or enter code</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Room Code */}
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">
            Room Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-4 text-center">
              <span className="text-white font-mono text-2xl sm:text-3xl tracking-[0.3em] font-bold text-shadow">
                {code}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(code, 'code')}
              className={`btn-ghost text-sm py-3 sm:py-2.5 px-4 flex items-center justify-center gap-2 ${
                copied === 'code' ? 'text-green-400 border-green-400/50' : ''
              }`}
            >
              {copied === 'code' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
