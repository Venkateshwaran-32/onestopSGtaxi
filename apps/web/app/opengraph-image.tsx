import { ImageResponse } from 'next/og';

export const alt = 'OneStopSGTaxi — Compare ride-hail fares in Singapore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'white',
              color: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 28,
            }}
          >
            1
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>OneStopSGTaxi</div>
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>One search.</span>
          <span style={{ color: '#888', fontSize: 60 }}>Every taxi app in Singapore.</span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
            flexWrap: 'wrap',
            fontSize: 18,
            color: '#aaa',
          }}
        >
          {['Grab', 'Gojek', 'TADA', 'Ryde', 'Zig', 'Geolah', 'Trans-Cab'].map((op) => (
            <span
              key={op}
              style={{
                padding: '6px 14px',
                border: '1px solid #333',
                borderRadius: 999,
                display: 'flex',
              }}
            >
              {op}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
