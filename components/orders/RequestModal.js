'use client';

import React from 'react';

function RequestModal({
  requestType,
  requestReason,
  setRequestReason,
  submittingRequest,
  onClose,
  onSubmit
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center select-none font-sans text-left">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={() => { if (!submittingRequest) onClose(); }}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full mx-4 animate-slide-up flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 font-serif capitalize">
          Request {requestType === 'cancel' ? 'Cancellation' : 'Return'}
        </h3>
        <p className="text-xxs text-gray-400 mt-1">
          Please provide a detailed reason. Your request will be sent to our support team for verification.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4" aria-label={`Request ${requestType === 'cancel' ? 'cancellation' : 'return'} form`}>
          <div>
            <label htmlFor="request-reason" className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Reason for {requestType === 'cancel' ? 'Cancellation' : 'Return'}
            </label>
            <textarea
              id="request-reason"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="e.g. Ordered a wrong item size, changed my mind, item package damaged..."
              rows={4}
              aria-required="true"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/5 bg-white resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submittingRequest}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest || !requestReason.trim()}
              aria-busy={submittingRequest}
              className="flex-1 bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white py-3 rounded-2xl font-bold text-xs shadow-md disabled:opacity-40 transition-colors uppercase tracking-wider"
            >
              {submittingRequest ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestModal;
