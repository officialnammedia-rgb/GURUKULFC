import React from 'react';
import Cloudscape from '../components/ui/cloudscape';

export default function CloudscapeBackground() {
  return (
    <div className="cloudscape-bg-wrapper">
      <Cloudscape
        speed={0.6}
        colorBottom="#06090e"
        colorMid="#19152b"
        colorTop="#6b1d1d"
        height="100%"
        className="w-full h-full"
      />
    </div>
  );
}
