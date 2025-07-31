import React from 'react';
import ShareButton from './ShareButton';

const ShareExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Native Sharing Examples</h2>
      
      {/* Text sharing example */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Share Text Content</h3>
        <p className="text-gray-600 mb-4">
          This example shows how to share text content using the native sharing API.
        </p>
        <ShareButton
          type="text"
          title="Shared from Careena"
          text="Check out this amazing medical loan assistant!"
          url="https://carepay.money"
        >
          Share Text
        </ShareButton>
      </div>

      {/* Image sharing example */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Share Image</h3>
        <p className="text-gray-600 mb-4">
          This example shows how to share an image using the native sharing API.
        </p>
        <ShareButton
          type="image"
          imageUrl="/images/careeena-avatar.jpg"
          fileName="careena-avatar.jpg"
          title="Careena Avatar"
          text="Here's the Careena avatar image"
        >
          Share Image
        </ShareButton>
      </div>

      {/* Visitor pass example (similar to your Vue.js code) */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Share Visitor Pass</h3>
        <p className="text-gray-600 mb-4">
          This example demonstrates sharing a visitor pass image, similar to your Vue.js implementation.
        </p>
        <ShareButton
          type="image"
          imageUrl="/visitor-pass.jpg"
          fileName="visitor-pass.jpg"
          title="Visitor Pass"
          text="Here is your DLF Two Horizon visitor pass."
        >
          Share Visitor Pass
        </ShareButton>
      </div>

      {/* Custom styling example */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Custom Styled Share Button</h3>
        <p className="text-gray-600 mb-4">
          Example with custom styling and different content.
        </p>
        <ShareButton
          type="text"
          title="Medical Loan Information"
          text="Get your medical loan approved quickly with Careena!"
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          Share Medical Info
        </ShareButton>
      </div>
    </div>
  );
};

export default ShareExample; 