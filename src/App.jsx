import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { runSpinCoatingSimulation } from './simulationEngine';

function App() {
  const [rpm, setRpm] = useState(3000);
  const [h0, setH0] = useState(20);
  const [eta0, setEta0] = useState(0.02);
  const [E, setE] = useState(0.5);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(runSpinCoatingSimulation(rpm, h0, eta0, E, 3.0));
  }, [rpm, h0, eta0, E]);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Meyerhofer 스핀 코팅 시뮬레이터</h2>
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <div><label><strong>RPM:</strong> {rpm}</label><br/><input type="range" min="1000" max="5000" step="100" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} /></div>
        <div><label><strong>초기 두께 (μm):</strong> {h0}</label><br/><input type="range" min="10" max="50" step="1" value={h0} onChange={(e) => setH0(Number(e.target.value))} /></div>
        <div><label><strong>초기 점도 (Pa·s):</strong> {eta0}</label><br/><input type="range" min="0.005" max="0.05" step="0.005" value={eta0} onChange={(e) => setEta0(Number(e.target.value))} /></div>
        <div><label><strong>증발률 E (μm/s):</strong> {E}</label><br/><input type="range" min="0.1" max="2.0" step="0.1" value={E} onChange={(e) => setE(Number(e.target.value))} /></div>
      </div>
      <LineChart width={900} height={400} data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" label={{ value: '시간 (초)', position: 'insideBottomRight', offset: -5 }} />
        <YAxis yAxisId="left" label={{ value: '두께 (μm)', angle: -90, position: 'insideLeft' }} stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" label={{ value: '점도 (Pa·s)', angle: 90, position: 'insideRight' }} stroke="#82ca9d" />
        <Tooltip /><Legend />
        <Line yAxisId="left" type="monotone" dataKey="thickness" stroke="#8884d8" name="박막 두께 (h)" dot={false} strokeWidth={3} />
        <Line yAxisId="right" type="monotone" dataKey="viscosity" stroke="#82ca9d" name="동점도 (η)" dot={false} strokeWidth={3} />
      </LineChart>
    </div>
  );
}
export default App;